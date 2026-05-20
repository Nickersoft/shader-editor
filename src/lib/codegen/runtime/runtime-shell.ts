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

import { getShaderNoiseTexture } from "./noise-texture";

const NOISE_TEXTURE_UNIT = 15;
const PREV_FRAME_TEXTURE_UNIT = 14;
// Reserved unit for the backdrop sampler — the composite of every layer
// below a given layer, used by backdrop-aware shape effects (Glass).
const BACKDROP_TEXTURE_UNIT = 13;
// Layer textures occupy a contiguous range starting at this unit. With ~13
// units left after reserving prev-pass (0), backdrop (13), prev-frame (14),
// and noise (15), there's room for ~12 layers. Practical cap is 16.
const LAYER_TEXTURE_BASE_UNIT = 1;

export interface PipelinePass {
  fragment: string;
  readsPrevPass: boolean;
  /** Marks the pass as the scene compositor — runtime binds u_layer_<i>. */
  bindLayerTextures?: boolean;
  /** Renders this pass into `layerTextures[commitToLayer]` instead of ping-pong. */
  commitToLayer?: number;
  /**
   * If set, the runtime binds this float as `u_layer_<i>_opacity` on the
   * compositor program. Provided per-layer; index aligns with `commitToLayer`.
   */
  layerOpacity?: number;
  /**
   * 'backdrop' = this is a backdrop-compositor pre-pass; runtime renders it
   * into the shared backdrop FBO rather than the ping-pong target. Other
   * mode values are descriptive only and don't affect runtime behaviour.
   */
  mode?: "js" | "glsl-render" | "compositor" | "backdrop";
  /**
   * When true, the runtime binds the backdrop texture as `u_backdrop` on
   * this pass — set on layer-effect passes whose GLSL refracts what's
   * beneath the current layer.
   */
  readsBackdrop?: boolean;
}

export interface PassContext {
  passIndex: number;
  // First texture unit available to image uniforms in this pass. 1 if the
  // pass reads u_prevPass (which sits on TEXTURE0), 0 otherwise.
  nextTextureUnit: number;
}

export interface PipelineHandle {
  render(
    time: number,
    width: number,
    height: number,
    bindUniforms: (ctx: PassContext, program: WebGLProgram) => void,
  ): void;
  /**
   * Update the cursor position (in canvas-space UV, 0..1 with origin top-left).
   * Tracked internally so `u_mouse` and `u_mouseDelta` are bound to every pass.
   */
  setMouse(x: number, y: number): void;
  /** Update the scene background color (RGBA 0..1). */
  setSceneBackground(color: [number, number, number, number]): void;
  /** Update per-layer opacities. Indexed by layer position. */
  setLayerOpacities(opacities: number[]): void;
  destroy(): void;
}

export interface PipelineOptions {
  /** Number of distinct layer textures to allocate. */
  layerCount?: number;
  /** Background color (RGBA 0..1) bound to `u_sceneBackground` on the compositor. */
  sceneBackground?: [number, number, number, number];
  /** Per-layer opacity values, indexed by layer position. */
  layerOpacities?: number[];
}

export function createShaderPipeline(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  passes: PipelinePass[],
  options: PipelineOptions = {},
): PipelineHandle {
  const layerCount = options.layerCount ?? 0;
  let sceneBackground: [number, number, number, number] = options.sceneBackground ?? [0, 0, 0, 1];
  let layerOpacities: number[] = options.layerOpacities ?? [];
  function compile(type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(
        type === gl.VERTEX_SHADER ? "Vertex" : "Fragment",
        "shader error:",
        gl.getShaderInfoLog(sh),
      );
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const programs: (WebGLProgram | null)[] = passes.map((p) => {
    const vs = compile(gl.VERTEX_SHADER, vertexSource);
    const fs = compile(gl.FRAGMENT_SHADER, p.fragment);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  });

  // Passthrough program for copying the prev-frame texture to the canvas. We
  // can't blitFramebuffer from the (single-sample) prev-frame FBO into the
  // default framebuffer when the canvas is multisampled (antialias: true), so
  // a textured fullscreen-quad draw is the portable approach.
  const PASSTHROUGH_VS = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
  const PASSTHROUGH_FS = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
void main() { fragColor = texture(u_src, v_uv); }`;
  const passthroughProgram = (() => {
    const vs = compile(gl.VERTEX_SHADER, PASSTHROUGH_VS);
    const fs = compile(gl.FRAGMENT_SHADER, PASSTHROUGH_FS);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
  })();

  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let texA: WebGLTexture | null = null;
  let texB: WebGLTexture | null = null;
  let fboA: WebGLFramebuffer | null = null;
  let fboB: WebGLFramebuffer | null = null;
  // Persistent prev-frame texture/FBO. Holds the last rendered frame so any
  // pass that samples `u_prevFrame` can read state across frames (used by
  // cursor-ripples wave equation, particle trails, fluid sims, etc.).
  let prevFrameTex: WebGLTexture | null = null;
  let prevFrameFbo: WebGLFramebuffer | null = null;
  // Shared backdrop FBO. Holds the composite of every layer below a
  // backdrop-aware layer (i.e. one whose effect chain uses u_backdrop).
  // Allocated lazily on first use since most scenes don't need it.
  let backdropTex: WebGLTexture | null = null;
  let backdropFbo: WebGLFramebuffer | null = null;
  // One persistent texture per scene Layer. The compositor pass samples
  // these via `u_layer_<i>` to blend layers in render order.
  let layerTextures: (WebGLTexture | null)[] = [];
  let layerFbos: (WebGLFramebuffer | null)[] = [];
  let fboW = 0;
  let fboH = 0;

  // Cursor state, in 0..1 UV coordinates. setMouse() is called by the host
  // on mousemove. mouseDelta is the per-frame movement, recomputed inside
  // render() so it reflects the actual frame cadence.
  let mouseX = 0.5;
  let mouseY = 0.5;
  let lastFrameMouseX = 0.5;
  let lastFrameMouseY = 0.5;

  // Shared 256×256 RGB noise texture. Bound globally on TEXTURE15 every pass
  // so any layer that references `u_noiseTexture` (smoke-ring, warp, god-rays,
  // halftone, etc.) can sample it without per-layer wiring. The image loads
  // asynchronously; we upload pixels once it arrives. Until then the texture
  // stays at 1×1 white so sampling produces a harmless constant.
  const noiseTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const noiseImage = getShaderNoiseTexture();
  if (noiseImage) {
    if (noiseImage.complete && noiseImage.naturalWidth > 0) {
      uploadNoise(noiseImage);
    } else {
      noiseImage.addEventListener("load", () => uploadNoise(noiseImage));
    }
  }
  function uploadNoise(img: HTMLImageElement) {
    if (!noiseTexture) return;
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }

  function ensureFbos(w: number, h: number) {
    const layersAllocated = layerTextures.length === layerCount;
    if (w === fboW && h === fboH && texA && texB && prevFrameTex && layersAllocated) return;
    if (texA) gl.deleteTexture(texA);
    if (texB) gl.deleteTexture(texB);
    if (fboA) gl.deleteFramebuffer(fboA);
    if (fboB) gl.deleteFramebuffer(fboB);
    if (prevFrameTex) gl.deleteTexture(prevFrameTex);
    if (prevFrameFbo) gl.deleteFramebuffer(prevFrameFbo);
    if (backdropTex) gl.deleteTexture(backdropTex);
    if (backdropFbo) gl.deleteFramebuffer(backdropFbo);
    backdropTex = null;
    backdropFbo = null;
    for (const t of layerTextures) if (t) gl.deleteTexture(t);
    for (const f of layerFbos) if (f) gl.deleteFramebuffer(f);
    layerTextures = [];
    layerFbos = [];
    fboW = w;
    fboH = h;
    const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
    const maxAniso = anisoExt
      ? (gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number)
      : 1;
    const make = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      // LINEAR_MIPMAP_LINEAR + generateMipmap (called after each pass writes
      // to the FBO) plus anisotropic filtering let downstream layers use
      // textureGrad() for wide-radius blur sampling. The grad-based path
      // gives a smooth circular filter even on non-square FBOs because the
      // hardware samples multiple texels along the major axis.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (anisoExt) {
        gl.texParameterf(
          gl.TEXTURE_2D,
          anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,
          Math.min(16, maxAniso),
        );
      }
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return [t, f] as const;
    };
    const [tA, fA] = make();
    texA = tA;
    fboA = fA;
    const [tB, fB] = make();
    texB = tB;
    fboB = fB;
    const [tP, fP] = make();
    prevFrameTex = tP;
    prevFrameFbo = fP;
    // Backdrop FBO: same shape as the ping-pong/prev-frame textures so a
    // backdrop-compositor pass can write into it without any plumbing. Plain
    // LINEAR — backdrop sampling never needs mipmaps.
    const [tBd, fBd] = make();
    backdropTex = tBd;
    backdropFbo = fBd;
    gl.bindTexture(gl.TEXTURE_2D, backdropTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Allocate one persistent texture per scene Layer.
    for (let i = 0; i < layerCount; i++) {
      const [t, f] = make();
      layerTextures.push(t);
      layerFbos.push(f);
      // Layer textures are sampled by the compositor with plain LINEAR — they
      // don't need mipmaps and we don't want stale higher-mip data leaking
      // through if the layer's own pass clears to transparent.
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    // The make() helper sets LINEAR_MIPMAP_LINEAR for ping-pong textures
    // (downstream blur passes need it). The prev-frame texture, however, is
    // never mipmapped — sampling it would return (0,0,0,1) without mipmaps
    // and the canvas would stay black. Override to plain LINEAR.
    gl.bindTexture(gl.TEXTURE_2D, prevFrameTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Clear prev-frame texture so the first frame's sample reads transparent
    // black instead of garbage.
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFrameFbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function render(
    time: number,
    width: number,
    height: number,
    bindUniforms: (ctx: PassContext, prog: WebGLProgram) => void,
  ) {
    if (passes.length === 0) return;
    ensureFbos(width, height);

    let read: WebGLTexture | null = texA;
    let writeFbo: WebGLFramebuffer | null = fboB;

    if (passes[0].readsPrevPass) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    for (let i = 0; i < passes.length; i++) {
      const pass = passes[i];
      const prog = programs[i];
      if (!prog) continue;
      const isLast = i === passes.length - 1;
      const isLayerCommit = pass.commitToLayer !== undefined;
      gl.useProgram(prog);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const posLoc = gl.getAttribLocation(prog, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, "u_time");
      if (uTime !== null) gl.uniform1f(uTime, time);
      const uRes = gl.getUniformLocation(prog, "u_resolution");
      if (uRes !== null) gl.uniform2f(uRes, width, height);

      // Cursor uniforms. Bound on every program — getUniformLocation returns
      // null for programs that don't reference them, so the bind is a no-op.
      const uMouse = gl.getUniformLocation(prog, "u_mouse");
      if (uMouse !== null) gl.uniform2f(uMouse, mouseX, mouseY);
      const uMouseDelta = gl.getUniformLocation(prog, "u_mouseDelta");
      if (uMouseDelta !== null) {
        gl.uniform2f(uMouseDelta, mouseX - lastFrameMouseX, mouseY - lastFrameMouseY);
      }

      bindStructuredUvUniforms(prog, width, height);

      if (pass.readsPrevPass) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, read);
        const uPrev = gl.getUniformLocation(prog, "u_prevPass");
        if (uPrev !== null) gl.uniform1i(uPrev, 0);
      }

      // Bind the previous-frame texture on TEXTURE14. Like u_noiseTexture,
      // the bind is harmless when the program doesn't reference u_prevFrame.
      gl.activeTexture(gl.TEXTURE0 + PREV_FRAME_TEXTURE_UNIT);
      gl.bindTexture(gl.TEXTURE_2D, prevFrameTex);
      const uPrevFrame = gl.getUniformLocation(prog, "u_prevFrame");
      if (uPrevFrame !== null) gl.uniform1i(uPrevFrame, PREV_FRAME_TEXTURE_UNIT);

      // Bind the backdrop texture on its reserved unit. The bind is harmless
      // for programs that don't reference u_backdrop (location resolves null).
      if (pass.readsBackdrop && backdropTex) {
        gl.activeTexture(gl.TEXTURE0 + BACKDROP_TEXTURE_UNIT);
        gl.bindTexture(gl.TEXTURE_2D, backdropTex);
        const uBackdrop = gl.getUniformLocation(prog, "u_backdrop");
        if (uBackdrop !== null) gl.uniform1i(uBackdrop, BACKDROP_TEXTURE_UNIT);
      }

      // Bind global noise texture on the reserved high unit. getUniformLocation
      // returns null in passes that don't sample it, so the bind is harmless.
      gl.activeTexture(gl.TEXTURE0 + NOISE_TEXTURE_UNIT);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      const uNoise = gl.getUniformLocation(prog, "u_noiseTexture");
      if (uNoise !== null) gl.uniform1i(uNoise, NOISE_TEXTURE_UNIT);

      // Compositor binds layer textures intrinsically so user code never
      // touches them. Each layer occupies a contiguous unit starting at
      // LAYER_TEXTURE_BASE_UNIT.
      let firstFreeUnit = pass.readsPrevPass ? 1 : 0;
      if (pass.bindLayerTextures) {
        for (let li = 0; li < layerTextures.length; li++) {
          const unit = LAYER_TEXTURE_BASE_UNIT + li;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, layerTextures[li]);
          const loc = gl.getUniformLocation(prog, `u_layer_${li}`);
          if (loc !== null) gl.uniform1i(loc, unit);
          const opacityLoc = gl.getUniformLocation(prog, `u_layer_${li}_opacity`);
          if (opacityLoc !== null) {
            gl.uniform1f(opacityLoc, layerOpacities[li] ?? 1);
          }
        }
        const bgLoc = gl.getUniformLocation(prog, "u_sceneBackground");
        if (bgLoc !== null) gl.uniform4fv(bgLoc, sceneBackground);
        firstFreeUnit = Math.max(firstFreeUnit, LAYER_TEXTURE_BASE_UNIT + layerTextures.length);
      }

      bindUniforms({ passIndex: i, nextTextureUnit: firstFreeUnit }, prog);

      // Decide write target. Layer commits redirect to the persistent layer
      // FBO. The very last pass renders to prevFrameFbo so it can be blit to
      // the canvas while preserving the prev-frame state. Backdrop passes
      // write into the shared backdrop FBO and leave the ping-pong state
      // untouched — the layer chain that consumes the backdrop will start
      // its own ping-pong sequence on the following pass.
      const isBackdropPass = pass.mode === "backdrop";
      let writeTarget: WebGLFramebuffer | null;
      if (isBackdropPass) {
        writeTarget = backdropFbo;
      } else if (isLayerCommit) {
        writeTarget = layerFbos[pass.commitToLayer!] ?? null;
      } else if (isLast) {
        writeTarget = prevFrameFbo;
      } else {
        writeTarget = writeFbo;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeTarget);
      gl.viewport(0, 0, width, height);
      // Layer commits and backdrop composites start from a clean slate so
      // the output reflects only this pass's contribution.
      if (isLayerCommit || isBackdropPass) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (isBackdropPass) {
        // No ping-pong rotation — the next pass belongs to a layer's effect
        // chain and will read u_backdrop, not u_prevPass. Leave read/writeFbo
        // as they were (still scoped to a freshly-cleared ping-pong from the
        // previous layer commit).
      } else if (isLayerCommit) {
        // Reset ping-pong for the next layer's first pass — it does not read
        // from the previous layer (each layer renders independently).
        if (fboA) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
          gl.viewport(0, 0, width, height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        read = texA;
        writeFbo = fboB;
      } else if (!isLast) {
        const justWrote = writeFbo === fboA ? texA : texB;
        // Refresh the mip chain so downstream passes that sample with
        // textureLod() (e.g. wide-blur alpha-falloff) get hardware-filtered
        // mip levels instead of point-sampling level 0.
        gl.bindTexture(gl.TEXTURE_2D, justWrote);
        gl.generateMipmap(gl.TEXTURE_2D);
        read = justWrote;
        writeFbo = writeFbo === fboA ? fboB : fboA;
      }
    }

    // Final pass output now lives in prevFrameTex. Copy it to the canvas with
    // a passthrough textured quad — works whether or not the default FBO is
    // multisampled.
    if (passthroughProgram) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(passthroughProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const ptPos = gl.getAttribLocation(passthroughProgram, "a_position");
      gl.enableVertexAttribArray(ptPos);
      gl.vertexAttribPointer(ptPos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, prevFrameTex);
      const uSrc = gl.getUniformLocation(passthroughProgram, "u_src");
      if (uSrc !== null) gl.uniform1i(uSrc, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    lastFrameMouseX = mouseX;
    lastFrameMouseY = mouseY;
  }

  function setMouse(x: number, y: number) {
    mouseX = x;
    mouseY = y;
  }

  function setSceneBackground(color: [number, number, number, number]) {
    sceneBackground = color;
  }

  function setLayerOpacities(opacities: number[]) {
    layerOpacities = opacities;
  }

  function destroy() {
    if (texA) gl.deleteTexture(texA);
    if (texB) gl.deleteTexture(texB);
    if (fboA) gl.deleteFramebuffer(fboA);
    if (fboB) gl.deleteFramebuffer(fboB);
    if (prevFrameTex) gl.deleteTexture(prevFrameTex);
    if (prevFrameFbo) gl.deleteFramebuffer(prevFrameFbo);
    if (backdropTex) gl.deleteTexture(backdropTex);
    if (backdropFbo) gl.deleteFramebuffer(backdropFbo);
    for (const t of layerTextures) if (t) gl.deleteTexture(t);
    for (const f of layerFbos) if (f) gl.deleteFramebuffer(f);
    if (noiseTexture) gl.deleteTexture(noiseTexture);
    if (buffer) gl.deleteBuffer(buffer);
    if (passthroughProgram) gl.deleteProgram(passthroughProgram);
    programs.forEach((p) => p && gl.deleteProgram(p));
  }

  // Default values for the structured UV varyings used by primitives that
  // need object/responsive/pattern/image-domain coordinates. The vertex
  // shader emits these on demand; if a primitive doesn't reference them,
  // the uniform locations resolve to null and these binds are no-ops.
  function bindStructuredUvUniforms(prog: WebGLProgram, width: number, height: number) {
    const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
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
    };
    for (const [name, value] of Object.entries(defaults)) {
      const loc = gl.getUniformLocation(prog, name);
      if (loc !== null) gl.uniform1f(loc, value);
    }
    if (width <= 0 || height <= 0) {
      const res = gl.getUniformLocation(prog, "u_resolution");
      if (res !== null) gl.uniform2f(res, Math.max(width, 1), Math.max(height, 1));
    }
  }

  return { render, setMouse, setSceneBackground, setLayerOpacities, destroy };
}
