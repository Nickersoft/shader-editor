// Minimal image + palette binding helpers inlined into generator-emitted
// React and vanilla components. Kept dependency-free so the exported code is
// drop-in usable in any project.
//
// IMPORTANT: this file is the single source of truth for the export helpers.
// The generator inlines its source verbatim into exported React/Vanilla code
// so the export and the preview can never drift.

export interface ImageSourceProp {
  url?: string | null;
  fit?: "cover" | "contain" | "fill";
  scale?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
}

// `string` is a convenience shorthand for `{ url: string }`.
export type ImageProp = string | ImageSourceProp | null | undefined;

export interface ImageEntry {
  texture: WebGLTexture | null;
  aspect: number;
}

export interface ImageCache {
  ensure(src: ImageProp): void;
  get(src: ImageProp): ImageEntry | null;
  getPlaceholder(): WebGLTexture;
  destroy(): void;
}

export function createImageCache(gl: WebGL2RenderingContext, onLoad?: () => void): ImageCache {
  const entries = new Map<string, ImageEntry>();
  let placeholder: WebGLTexture | null = null;

  function urlOf(src: ImageProp): string | null {
    if (!src) return null;
    if (typeof src === "string") return src;
    return src.url ?? null;
  }

  function getPlaceholder(): WebGLTexture {
    if (placeholder) return placeholder;
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to allocate placeholder texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    placeholder = tex;
    return tex;
  }

  function ensure(src: ImageProp): void {
    const url = urlOf(src);
    if (!url) return;
    if (entries.has(url)) return;
    entries.set(url, { texture: null, aspect: 1 });
    const img = new Image();
    if (/^https?:/i.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = gl.createTexture();
      if (!tex) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const ext = gl.getExtension("EXT_texture_filter_anisotropic");
      if (ext) {
        const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
      }
      entries.set(url, {
        texture: tex,
        aspect: img.naturalWidth / Math.max(1, img.naturalHeight),
      });
      if (onLoad) onLoad();
    };
    img.src = url;
  }

  function get(src: ImageProp): ImageEntry | null {
    const url = urlOf(src);
    if (!url) return null;
    return entries.get(url) ?? null;
  }

  function destroy(): void {
    for (const e of entries.values()) {
      if (e.texture) gl.deleteTexture(e.texture);
    }
    entries.clear();
    if (placeholder) {
      gl.deleteTexture(placeholder);
      placeholder = null;
    }
  }

  return { ensure, get, getPlaceholder, destroy };
}

export function fitModeFromString(fit: string | undefined): number {
  if (fit === "contain") return 1;
  if (fit === "fill") return 2;
  return 0; // cover
}

// Bind a sampler + its `_meta` and `_offset` companion uniforms. Returns the
// next free texture unit. Caller advances `textureUnit` only when this layer
// actually binds a sampler in the current pass (loc !== null).
export function bindSamplerUniform(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  baseName: string,
  src: ImageProp,
  cache: ImageCache,
  textureUnit: number,
): number {
  const loc = gl.getUniformLocation(prog, baseName);
  if (loc === null) return textureUnit;
  const entry = cache.get(src);
  const tex = entry?.texture ?? cache.getPlaceholder();
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc, textureUnit);
  const obj = typeof src === "object" && src !== null ? src : null;
  const fit = fitModeFromString(obj?.fit);
  const scale = obj?.scale ?? 1;
  const rotation = obj?.rotation ?? 0;
  const ox = obj?.offsetX ?? 0;
  const oy = obj?.offsetY ?? 0;
  const metaLoc = gl.getUniformLocation(prog, baseName + "_meta");
  if (metaLoc !== null) {
    gl.uniform4fv(metaLoc, [entry?.aspect ?? 1, fit, scale, rotation]);
  }
  const imageAspectLoc = gl.getUniformLocation(prog, "u_imageAspectRatio");
  if (imageAspectLoc !== null) {
    gl.uniform1f(imageAspectLoc, entry?.aspect ?? 1);
  }
  const offsetLoc = gl.getUniformLocation(prog, baseName + "_offset");
  if (offsetLoc !== null) {
    gl.uniform2fv(offsetLoc, [ox, oy]);
  }
  return textureUnit + 1;
}

// Bind a vec4Array uniform plus its `_count` companion. Accepts colors as
// `number[][]` ([r,g,b] or [r,g,b,a] entries in 0..1).
export function bindPaletteUniform(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  baseName: string,
  colors: number[][],
  arrayLength: number,
): void {
  const loc = gl.getUniformLocation(prog, baseName);
  if (loc === null) return;
  const flat = new Float32Array(arrayLength * 4);
  const n = Math.min(colors.length, arrayLength);
  for (let i = 0; i < n; i++) {
    const c = colors[i];
    flat[i * 4 + 0] = c[0] ?? 0;
    flat[i * 4 + 1] = c[1] ?? 0;
    flat[i * 4 + 2] = c[2] ?? 0;
    flat[i * 4 + 3] = c[3] ?? 1;
  }
  gl.uniform4fv(loc, flat);
  const countLoc = gl.getUniformLocation(prog, baseName + "_count");
  if (countLoc !== null) gl.uniform1i(countLoc, n);
}
