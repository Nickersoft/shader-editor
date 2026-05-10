// URL → WebGLTexture cache with LRU eviction and oversize downsampling.
// Used by the in-app preview to manage texture lifecycle without thrashing on
// every uniform update. Editor-only for now; exported components implement
// their own simpler binding.

const MAX_TEXTURE_SIZE = 2048;
// Upscale tiny / vector images to at least this size so wide-blur shader
// sampling doesn't reveal sub-pixel artifacts.
const MIN_RASTER_SIZE = 1024;
// Target SVG rasterization size before upload — matches Paper's preprocessing.
const SVG_RASTER_SIZE = 1024;
const MAX_ENTRIES = 20;

interface CacheEntry {
  texture: WebGLTexture;
  width: number;
  height: number;
  aspect: number;
  /** Updated on every getTexture() so eviction picks the oldest. */
  lastUsed: number;
}

export class TextureCache {
  private gl: WebGL2RenderingContext;
  private entries = new Map<string, CacheEntry>();
  private placeholder: WebGLTexture | null = null;
  private inFlight = new Map<string, Promise<CacheEntry | null>>();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /** 1×1 transparent texture; safe to bind unconditionally as a fallback. */
  getPlaceholder(): WebGLTexture {
    if (this.placeholder) return this.placeholder;
    const gl = this.gl;
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
    this.placeholder = tex;
    return tex;
  }

  /** Returns a cached entry synchronously if loaded; otherwise null. */
  peek(url: string): CacheEntry | null {
    const entry = this.entries.get(url);
    if (!entry) return null;
    entry.lastUsed = performance.now();
    return entry;
  }

  /**
   * Loads `url` into a texture (cache or fresh). Calls onReady once the
   * upload completes so the renderer can re-render with the new texture.
   */
  prefetch(url: string, onReady?: () => void): void {
    if (this.entries.has(url)) return;
    if (this.inFlight.has(url)) return;
    const promise = this.load(url).finally(() => this.inFlight.delete(url));
    this.inFlight.set(url, promise);
    if (onReady) {
      promise.then((entry) => {
        if (entry) onReady();
      });
    }
  }

  private async load(url: string): Promise<CacheEntry | null> {
    const gl = this.gl;
    const isSvg = isSvgUrl(url);
    let source: TexImageSource | null = null;
    let w = 0;
    let h = 0;
    if (isSvg) {
      // For SVGs we want to rasterize at MIN_RASTER_SIZE for crisp blur
      // sampling. The browser rasterizes <img> elements at the SVG's
      // intrinsic size, so even drawing the result at a larger canvas just
      // upscales the low-res raster. Instead, fetch the SVG bytes and give
      // them a hard width/height inside the SVG markup itself, then load
      // the modified SVG via blob URL — that triggers the browser's SVG
      // renderer at the requested resolution.
      const rasterized = await rasterizeSvgAtSize(url, SVG_RASTER_SIZE).catch(() => null);
      if (!rasterized) return null;
      source = rasterized;
      w = rasterized.width;
      h = rasterized.height;
    } else {
      const img = await loadImage(url).catch(() => null);
      if (!img) return null;
      source = img;
      w = img.naturalWidth;
      h = img.naturalHeight;
    }
    const limit = Math.min(MAX_TEXTURE_SIZE, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number);
    if (w > limit || h > limit) {
      const scale = Math.min(limit / w, limit / h);
      const dw = Math.max(1, Math.floor(w * scale));
      const dh = Math.max(1, Math.floor(h * scale));
      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(source as CanvasImageSource, 0, 0, dw, dh);
        source = canvas;
        w = dw;
        h = dh;
      }
    }
    if (!source) return null;

    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // WebGL2 supports mipmaps for arbitrary-size textures. Generating them
    // and using LINEAR_MIPMAP_LINEAR eliminates the jagged staircases when
    // shader code samples the texture at distances larger than its texel
    // size — which is exactly what wide-blur passes do.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisoExt) {
      const maxAniso = gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, maxAniso));
    }

    const entry: CacheEntry = {
      texture: tex,
      width: w,
      height: h,
      aspect: w / Math.max(1, h),
      lastUsed: performance.now(),
    };
    this.entries.set(url, entry);
    this.evictIfNeeded();
    return entry;
  }

  private evictIfNeeded() {
    if (this.entries.size <= MAX_ENTRIES) return;
    let oldestKey: string | null = null;
    let oldestUsed = Infinity;
    for (const [k, v] of this.entries) {
      if (v.lastUsed < oldestUsed) {
        oldestUsed = v.lastUsed;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      const dead = this.entries.get(oldestKey);
      if (dead) this.gl.deleteTexture(dead.texture);
      this.entries.delete(oldestKey);
    }
  }

  destroy() {
    for (const entry of this.entries.values()) {
      this.gl.deleteTexture(entry.texture);
    }
    this.entries.clear();
    if (this.placeholder) {
      this.gl.deleteTexture(this.placeholder);
      this.placeholder = null;
    }
  }
}

function isSvgUrl(url: string): boolean {
  if (url.startsWith("data:image/svg+xml")) return true;
  // Strip query/hash before checking extension.
  const base = url.split("?")[0].split("#")[0];
  return /\.svg$/i.test(base);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // dataURLs and blob URLs don't need crossOrigin; only set for absolute http(s).
    if (/^https?:/i.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Fetch SVG bytes, inject explicit width/height into the <svg> root so the
// browser's SVG renderer rasterizes at the desired size, then return an
// HTMLImageElement loaded from the modified SVG. This is the reliable way
// to force high-resolution SVG rasterization — setting width/height on a
// regular <img> element is just a hint that browsers may ignore when the
// SVG markup itself declares a size.
async function rasterizeSvgAtSize(url: string, targetSize: number): Promise<HTMLImageElement> {
  let svgText: string;
  if (url.startsWith("data:image/svg+xml")) {
    const comma = url.indexOf(",");
    const payload = url.slice(comma + 1);
    if (url.slice(0, comma).includes(";base64")) {
      svgText = atob(payload);
    } else {
      svgText = decodeURIComponent(payload);
    }
  } else {
    const fetchOpts: RequestInit = /^https?:/i.test(url) ? { mode: "cors" } : {};
    const res = await fetch(url, fetchOpts);
    svgText = await res.text();
  }
  // Inject (or replace) width/height on the <svg> root element. Preserve
  // the viewBox if present so coordinates still map correctly. If the SVG
  // doesn't have a viewBox, derive one from the existing width/height to
  // keep the content proportional after scaling.
  svgText = svgText.replace(/<svg\b[^>]*>/i, (tag) => {
    let next = tag;
    const hasViewBox = /\bviewBox\s*=/i.test(next);
    if (!hasViewBox) {
      const w = next.match(/\bwidth\s*=\s*"([^"]+)"/i)?.[1];
      const h = next.match(/\bheight\s*=\s*"([^"]+)"/i)?.[1];
      if (w && h) {
        next = next.replace("<svg", `<svg viewBox="0 0 ${parseFloat(w)} ${parseFloat(h)}"`);
      }
    }
    next = next.replace(/\swidth\s*=\s*"[^"]*"/i, "");
    next = next.replace(/\sheight\s*=\s*"[^"]*"/i, "");
    next = next.replace("<svg", `<svg width="${targetSize}" height="${targetSize}"`);
    return next;
  });
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(blobUrl);
    return img;
  } finally {
    // Defer revocation so the texture upload reads pixel data from a still-valid bitmap.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }
}
