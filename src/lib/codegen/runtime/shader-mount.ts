// Portable shader mount.
//
// Accepts a `<canvas>` plus a `{ vertex, passes, uniforms, values }` bundle and
// owns everything the host would otherwise have to write itself: WebGL2 setup,
// canvas sizing via ResizeObserver, RAF loop with visibility pause, mouse
// tracking, and uniform binding (driven by each uniform's UniformSpec.type).
//
// This file is the single shipping unit for the shadcn-style export. Each
// generated shader file is a small `{ vertex, passes, uniforms, defaults }`
// bundle that calls `mountShader(canvas, …)` against this runtime — no
// per-shader WebGL plumbing, no per-shader binding switch.
//
// The pipeline kernel (`createShaderPipeline`) handles multi-pass rendering,
// ping-pong FBOs, layer textures, and the global noise/prev-frame textures.
// This wrapper composes the user-provided values with the pipeline's
// `bindUniforms` callback so the host never has to reason about texture units
// or pass indices.

import { createShaderPipeline, type PipelinePass } from "./runtime-shell";
import {
  bindPaletteUniform,
  bindSamplerUniform,
  createImageCache,
  type ImageCache,
  type ImageProp,
} from "./export-image-helper";
import type { UniformSpec } from "../types";

export interface MountOptions {
  /** Vertex-shader source. Must declare `in vec2 a_position;`. */
  vertex: string;
  /** One or more fragment passes. The last pass writes to the canvas. */
  passes: PipelinePass[];
  /** Metadata for each user-controllable uniform. */
  uniforms: UniformSpec[];
  /** Initial values, keyed by GLSL uniform name (e.g. `u_voronoi_colorA`). */
  values?: Record<string, unknown>;
  /**
   * Pixel-ratio override. Defaults to `window.devicePixelRatio` (clamped to 1
   * minimum). Lower values trade fidelity for performance on dense displays.
   */
  pixelRatio?: number;
  /** Number of layer textures to allocate (compositor-pass shaders). */
  layerCount?: number;
  /** Background color for the compositor pass, RGBA in 0..1. */
  sceneBackground?: [number, number, number, number];
  /** Per-layer opacity values, indexed by layer position. */
  layerOpacities?: number[];
  /**
   * If false, suppresses the built-in `mousemove` listener. Useful if the host
   * already tracks the cursor and calls `setMouse` manually (e.g. when the
   * canvas sits behind an overlay that intercepts pointer events).
   */
  trackMouse?: boolean;
}

export interface MountHandle {
  /** Merge new values into the live binding map. Re-renders next frame. */
  update(values: Record<string, unknown>): void;
  /** Manually set cursor position in canvas-space UV (0..1, top-left origin). */
  setMouse(x: number, y: number): void;
  /** Update the scene background (compositor passes only). */
  setSceneBackground(color: [number, number, number, number]): void;
  /** Update per-layer opacity values (compositor passes only). */
  setLayerOpacities(opacities: number[]): void;
  /** Tear down GL resources, RAF, ResizeObserver, and event listeners. */
  destroy(): void;
}

/**
 * Mount a shader bundle onto a canvas. Returns a handle for live updates and
 * teardown. Equivalent to constructing a Paper-style ShaderMount, but the
 * bundle is provided as plain data (vertex + passes + uniform metadata) so
 * the same mount works for every generated shader.
 */
export function mountShader(canvas: HTMLCanvasElement, options: MountOptions): MountHandle {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  if (!gl) throw new Error("shader-mount: WebGL2 is not supported");

  let values: Record<string, unknown> = { ...(options.values ?? {}) };
  const uniforms = options.uniforms;
  const trackMouse = options.trackMouse ?? true;

  const cache: ImageCache = createImageCache(gl);

  const pipeline = createShaderPipeline(gl, options.vertex, options.passes, {
    layerCount: options.layerCount,
    sceneBackground: options.sceneBackground,
    layerOpacities: options.layerOpacities,
  });

  // Resize via ResizeObserver. The observer drives the canvas's backing-store
  // size; CSS controls the visual size. Pixel ratio governs the multiplier.
  const ratioOf = () => {
    if (options.pixelRatio !== undefined) return options.pixelRatio;
    return typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio || 1) : 1;
  };
  let width = 0;
  let height = 0;
  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    const r = ratioOf();
    width = Math.max(1, Math.round(rect.width * r));
    height = Math.max(1, Math.round(rect.height * r));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(canvas);

  // Mouse tracking. We translate to the same 0..1 UV convention the runtime
  // uses (top-left origin), so generated GLSL can sample u_mouse without
  // y-flipping per shader.
  const handleMouse = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    pipeline.setMouse(x, 1 - y);
  };
  if (trackMouse) canvas.addEventListener("mousemove", handleMouse);

  // Pause RAF when the page is hidden so background tabs don't burn frames.
  let paused = false;
  const onVisibility = () => {
    paused = document.hidden;
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  // Pre-warm any sampler defaults so the first frame can read them.
  for (const spec of uniforms) {
    if (spec.type !== "sampler2D") continue;
    const v = (values[spec.name] ?? spec.default) as ImageProp;
    if (v) cache.ensure(v);
  }

  const start = performance.now();
  let rafId = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    if (paused) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    // Re-prime image cache with whatever the current values point at — host
    // can swap a sampler by name and the new texture loads asynchronously.
    for (const spec of uniforms) {
      if (spec.type !== "sampler2D") continue;
      const v = (values[spec.name] ?? spec.default) as ImageProp;
      if (v) cache.ensure(v);
    }

    const time = (performance.now() - start) / 1000;
    pipeline.render(time, width, height, (ctx, prog) => {
      let unit = ctx.nextTextureUnit;
      for (const spec of uniforms) {
        const value = values[spec.name] ?? spec.default;
        unit = bindByType(gl, prog, spec, value, cache, unit);
      }
    });
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  return {
    update(next) {
      values = { ...values, ...next };
    },
    setMouse(x, y) {
      pipeline.setMouse(x, y);
    },
    setSceneBackground(color) {
      pipeline.setSceneBackground(color);
    },
    setLayerOpacities(opacities) {
      pipeline.setLayerOpacities(opacities);
    },
    destroy() {
      stopped = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (trackMouse) canvas.removeEventListener("mousemove", handleMouse);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      pipeline.destroy();
      cache.destroy();
    },
  };
}

/**
 * Bind one uniform value according to its GLSL type. Returns the next free
 * texture unit so sampler binds can chain. Mirrors the per-shader switch the
 * vanilla/React exports used to emit, lifted up so every shader shares it.
 */
function bindByType(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  spec: UniformSpec,
  value: unknown,
  cache: ImageCache,
  unit: number,
): number {
  switch (spec.type) {
    case "float": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) gl.uniform1f(loc, Number(value ?? 0));
      return unit;
    }
    case "int": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) gl.uniform1i(loc, Math.trunc(Number(value ?? 0)));
      return unit;
    }
    case "bool": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) gl.uniform1i(loc, value ? 1 : 0);
      return unit;
    }
    case "vec2": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) {
        const v = (value as number[]) ?? [0, 0];
        gl.uniform2f(loc, v[0] ?? 0, v[1] ?? 0);
      }
      return unit;
    }
    case "vec3": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) {
        const v = (value as number[]) ?? [0, 0, 0];
        gl.uniform3f(loc, v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
      }
      return unit;
    }
    case "vec4": {
      const loc = gl.getUniformLocation(prog, spec.name);
      if (loc !== null) {
        const v = (value as number[]) ?? [0, 0, 0, 0];
        gl.uniform4f(loc, v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0);
      }
      return unit;
    }
    case "sampler2D":
      return bindSamplerUniform(gl, prog, spec.name, value as ImageProp, cache, unit);
    case "vec4Array":
      bindPaletteUniform(gl, prog, spec.name, (value as number[][]) ?? [], spec.arrayLength ?? 10);
      return unit;
  }
}
