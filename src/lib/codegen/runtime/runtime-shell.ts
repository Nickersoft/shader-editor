// Multi-pass GL pipeline used by both the live preview and any exported
// component. Compiles each pass's program, manages two ping-pong FBOs, and
// drives a fullscreen-quad draw per pass. Uniform binding is delegated via
// `bindUniforms` so callers can read from React state, props, or an options
// object without changing this file.
//
// IMPORTANT: this file is the single source of truth for the runtime. The
// generator inlines its source verbatim into exported React/Vanilla code so
// the export and the preview can never drift.
//
// Texture-unit convention:
//   TEXTURE0  — owned by the runtime, bound to `u_prevPass` when read.
//   TEXTURE15 — owned by the runtime, bound to `u_noiseTexture` (a 256×256
//               RGB noise lookup) for every pass that declares it.
//   TEXTURE1..14 — image-uniform binders (callers of `bindUniforms`).
// `passContext.nextTextureUnit` reflects the first free unit for that pass.

import { getShaderNoiseTexture } from './noise-texture'

const NOISE_TEXTURE_UNIT = 15

export interface PipelinePass {
  fragment: string
  readsPrevPass: boolean
}

export interface PassContext {
  passIndex: number
  // First texture unit available to image uniforms in this pass. 1 if the
  // pass reads u_prevPass (which sits on TEXTURE0), 0 otherwise.
  nextTextureUnit: number
}

export interface PipelineHandle {
  render(
    time: number,
    width: number,
    height: number,
    bindUniforms: (ctx: PassContext, program: WebGLProgram) => void
  ): void
  destroy(): void
}

export function createShaderPipeline(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  passes: PipelinePass[]
): PipelineHandle {
  function compile(type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(
        type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment',
        'shader error:',
        gl.getShaderInfoLog(sh)
      )
      gl.deleteShader(sh)
      return null
    }
    return sh
  }

  const programs: (WebGLProgram | null)[] = passes.map((p) => {
    const vs = compile(gl.VERTEX_SHADER, vertexSource)
    const fs = compile(gl.FRAGMENT_SHADER, p.fragment)
    if (!vs || !fs) return null
    const prog = gl.createProgram()
    if (!prog) return null
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog))
      gl.deleteProgram(prog)
      return null
    }
    return prog
  })

  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  let texA: WebGLTexture | null = null
  let texB: WebGLTexture | null = null
  let fboA: WebGLFramebuffer | null = null
  let fboB: WebGLFramebuffer | null = null
  let fboW = 0
  let fboH = 0

  // Shared 256×256 RGB noise texture. Bound globally on TEXTURE15 every pass
  // so any layer that references `u_noiseTexture` (smoke-ring, warp, god-rays,
  // halftone, etc.) can sample it without per-layer wiring. The image loads
  // asynchronously; we upload pixels once it arrives. Until then the texture
  // stays at 1×1 white so sampling produces a harmless constant.
  const noiseTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255])
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  const noiseImage = getShaderNoiseTexture()
  if (noiseImage) {
    if (noiseImage.complete && noiseImage.naturalWidth > 0) {
      uploadNoise(noiseImage)
    } else {
      noiseImage.addEventListener('load', () => uploadNoise(noiseImage))
    }
  }
  function uploadNoise(img: HTMLImageElement) {
    if (!noiseTexture) return
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  }

  function ensureFbos(w: number, h: number) {
    if (w === fboW && h === fboH && texA && texB) return
    if (texA) gl.deleteTexture(texA)
    if (texB) gl.deleteTexture(texB)
    if (fboA) gl.deleteFramebuffer(fboA)
    if (fboB) gl.deleteFramebuffer(fboB)
    fboW = w
    fboH = h
    const anisoExt = gl.getExtension('EXT_texture_filter_anisotropic')
    const maxAniso = anisoExt
      ? (gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number)
      : 1
    const make = () => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      // LINEAR_MIPMAP_LINEAR + generateMipmap (called after each pass writes
      // to the FBO) plus anisotropic filtering let downstream layers use
      // textureGrad() for wide-radius blur sampling. The grad-based path
      // gives a smooth circular filter even on non-square FBOs because the
      // hardware samples multiple texels along the major axis.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      if (anisoExt) {
        gl.texParameterf(
          gl.TEXTURE_2D,
          anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(16, maxAniso)
        )
      }
      const f = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, f)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      return [t, f] as const
    }
    const [tA, fA] = make()
    texA = tA
    fboA = fA
    const [tB, fB] = make()
    texB = tB
    fboB = fB
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  function render(
    time: number,
    width: number,
    height: number,
    bindUniforms: (ctx: PassContext, prog: WebGLProgram) => void
  ) {
    if (passes.length === 0) return
    ensureFbos(width, height)

    let read: WebGLTexture | null = texA
    let writeFbo: WebGLFramebuffer | null = fboB

    if (passes[0].readsPrevPass) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA)
      gl.viewport(0, 0, width, height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }

    for (let i = 0; i < passes.length; i++) {
      const pass = passes[i]
      const prog = programs[i]
      if (!prog) continue
      const isLast = i === passes.length - 1
      gl.useProgram(prog)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      const posLoc = gl.getAttribLocation(prog, 'a_position')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const uTime = gl.getUniformLocation(prog, 'u_time')
      if (uTime !== null) gl.uniform1f(uTime, time)
      const uRes = gl.getUniformLocation(prog, 'u_resolution')
      if (uRes !== null) gl.uniform2f(uRes, width, height)

      bindStructuredUvUniforms(prog, width, height)

      if (pass.readsPrevPass) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, read)
        const uPrev = gl.getUniformLocation(prog, 'u_prevPass')
        if (uPrev !== null) gl.uniform1i(uPrev, 0)
      }

      // Bind global noise texture on the reserved high unit. getUniformLocation
      // returns null in passes that don't sample it, so the bind is harmless.
      gl.activeTexture(gl.TEXTURE0 + NOISE_TEXTURE_UNIT)
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture)
      const uNoise = gl.getUniformLocation(prog, 'u_noiseTexture')
      if (uNoise !== null) gl.uniform1i(uNoise, NOISE_TEXTURE_UNIT)

      bindUniforms(
        { passIndex: i, nextTextureUnit: pass.readsPrevPass ? 1 : 0 },
        prog
      )

      gl.bindFramebuffer(gl.FRAMEBUFFER, isLast ? null : writeFbo)
      gl.viewport(0, 0, width, height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      if (!isLast) {
        const justWrote = writeFbo === fboA ? texA : texB
        // Refresh the mip chain so downstream passes that sample with
        // textureLod() (e.g. wide-blur alpha-falloff) get hardware-filtered
        // mip levels instead of point-sampling level 0.
        gl.bindTexture(gl.TEXTURE_2D, justWrote)
        gl.generateMipmap(gl.TEXTURE_2D)
        read = justWrote
        writeFbo = writeFbo === fboA ? fboB : fboA
      }
    }
  }

  function destroy() {
    if (texA) gl.deleteTexture(texA)
    if (texB) gl.deleteTexture(texB)
    if (fboA) gl.deleteFramebuffer(fboA)
    if (fboB) gl.deleteFramebuffer(fboB)
    if (noiseTexture) gl.deleteTexture(noiseTexture)
    if (buffer) gl.deleteBuffer(buffer)
    programs.forEach((p) => p && gl.deleteProgram(p))
  }

  // Default values for the structured UV varyings used by primitives that
  // need object/responsive/pattern/image-domain coordinates. The vertex
  // shader emits these on demand; if a primitive doesn't reference them,
  // the uniform locations resolve to null and these binds are no-ops.
  function bindStructuredUvUniforms(prog: WebGLProgram, width: number, height: number) {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const defaults: Record<string, number> = {
      u_pixelRatio: pixelRatio,
      u_imageAspectRatio: 1,
      u_originX: 0.5,
      u_originY: 0.5,
      u_worldWidth: 0,
      u_worldHeight: 0,
      u_fit: 1,
      u_scale: 1,
      u_rotation: 0,
      u_offsetX: 0,
      u_offsetY: 0,
    }
    for (const [name, value] of Object.entries(defaults)) {
      const loc = gl.getUniformLocation(prog, name)
      if (loc !== null) gl.uniform1f(loc, value)
    }
    if (width <= 0 || height <= 0) {
      const res = gl.getUniformLocation(prog, 'u_resolution')
      if (res !== null) gl.uniform2f(res, Math.max(width, 1), Math.max(height, 1))
    }
  }

  return { render, destroy }
}
