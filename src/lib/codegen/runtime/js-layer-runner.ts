// Runtime execution of ProcessingNodes.
//
// A ProcessingNode publishes a single texture as its pass output. The runner
// tracks each enabled instance, hashes the inputs that would change its
// output (the node's config + inputs), and re-invokes `preprocess()` only
// when that hash actually changes. The resulting data URL is decoded into an
// HTMLImageElement and uploaded to a WebGL texture; that texture is what
// shader-preview binds to `u_<prefix>_jsOutput` during the node's pass.
//
// ProcessingNodes never run per-frame. They run once on creation, then again
// only when their input hash changes — so even a 200ms Poisson solve is paid
// once per upload, not 60 times per second.
//
// Generalization from the old js-layer-runner: this file no longer dispatches
// on a `preprocessor: 'heatmap' | 'liquidMetal' | ...` enum. It just calls
// `node.preprocess()` and trusts the node to localize its own logic.

import type { ProcessingNode } from "@/shaders/core/node.svelte";

interface RunnerEntry {
  hash: string;
  texture: WebGLTexture | null;
  loading: boolean;
}

export class JsLayerRunner {
  private gl: WebGL2RenderingContext;
  private placeholder: WebGLTexture;
  private entries = new Map<string, RunnerEntry>();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to allocate JsLayerRunner placeholder");
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
  }

  /**
   * Returns the texture currently associated with this ProcessingNode
   * instance. If the node's input hash changed, kicks off a re-run in the
   * background and calls `onReady` once the new texture has been uploaded.
   */
  ensure(node: ProcessingNode, onReady: () => void): WebGLTexture {
    const hash = hashInputs(node);
    const existing = this.entries.get(node.id);
    if (existing && existing.hash === hash) {
      return existing.texture ?? this.placeholder;
    }

    const carriedTexture = existing?.texture ?? null;
    const entry: RunnerEntry = { hash, texture: carriedTexture, loading: true };
    this.entries.set(node.id, entry);

    void this.run(node, hash, onReady);
    return entry.texture ?? this.placeholder;
  }

  private async run(node: ProcessingNode, hash: string, onReady: () => void) {
    let result: { dataUrl: string } | null;
    try {
      result = await node.preprocess();
    } catch (err) {
      console.error(`ProcessingNode "${node.typeId}" failed to preprocess:`, err);
      const entry = this.entries.get(node.id);
      if (entry && entry.hash === hash) entry.loading = false;
      return;
    }

    // The user may have already changed inputs while we were processing.
    // Bail if so — the more recent invocation will overwrite us.
    const current = this.entries.get(node.id);
    if (!current || current.hash !== hash) return;

    if (!result) {
      // Node reports "no input yet". Drop the texture so we render blank.
      if (current.texture) this.gl.deleteTexture(current.texture);
      current.texture = null;
      current.loading = false;
      onReady();
      return;
    }

    try {
      const tex = await this.uploadDataUrl(result.dataUrl);
      const stillCurrent = this.entries.get(node.id);
      if (!stillCurrent || stillCurrent.hash !== hash) {
        this.gl.deleteTexture(tex);
        return;
      }
      if (stillCurrent.texture) this.gl.deleteTexture(stillCurrent.texture);
      stillCurrent.texture = tex;
      stillCurrent.loading = false;
      onReady();
    } catch (err) {
      console.error(`ProcessingNode "${node.typeId}" failed to upload texture:`, err);
      const entry = this.entries.get(node.id);
      if (entry && entry.hash === hash) entry.loading = false;
    }
  }

  private uploadDataUrl(dataUrl: string): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const gl = this.gl;
        const tex = gl.createTexture();
        if (!tex) {
          reject(new Error("Failed to allocate ProcessingNode texture"));
          return;
        }
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
        resolve(tex);
      };
      img.onerror = () => reject(new Error("Failed to decode ProcessingNode image"));
      img.src = dataUrl;
    });
  }

  /** Drop cached state for nodes that no longer exist. */
  prune(activeIds: Set<string>) {
    for (const id of Array.from(this.entries.keys())) {
      if (!activeIds.has(id)) {
        const entry = this.entries.get(id);
        if (entry?.texture) this.gl.deleteTexture(entry.texture);
        this.entries.delete(id);
      }
    }
  }

  destroy() {
    for (const entry of this.entries.values()) {
      if (entry.texture) this.gl.deleteTexture(entry.texture);
    }
    this.entries.clear();
    this.gl.deleteTexture(this.placeholder);
  }
}

/**
 * Stable serialization of a node's inputs for change detection. Hashes both
 * `config` and `inputs`. Image fields hash by URL only — fit/scale/rotation
 * don't affect CPU preprocessing (those are GLSL-side sampling concerns).
 */
function hashInputs(node: ProcessingNode): string {
  return "cfg=" + serialize(node.config) + "|in=" + serialize(node.inputs);
}

function serialize(v: unknown): string {
  if (v === undefined || v === null) return "null";
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") {
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return "[" + v.map(serialize).join(",") + "]";
  if (typeof v === "object") {
    // Image-input shape: hash by url only.
    const obj = v as Record<string, unknown>;
    if ("url" in obj && typeof obj.url === "string") {
      return "img(" + obj.url + ")";
    }
    if ("url" in obj && obj.url === null) {
      return "img(null)";
    }
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => k + ":" + serialize(obj[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}
