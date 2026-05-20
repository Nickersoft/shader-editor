// Sampler — multi-tap read of `u_prevPass`. Generalises `sample-previous-pass`
// from a single tap to the five common shapes that effect graphs need:
//
//   kernel-3x3   3×3 weighted convolution (sharpness, emboss, custom kernels)
//   linear       N samples along a direction vector (linear blur, drift)
//   zoom         N samples between `center` and `uv` (zoom blur)
//   angular      N samples rotated around `center` (angular blur)
//   gaussian     (2R+1)² 2D Gaussian box (frosted glass, soft shadow). R is
//                clamped from `samples` to [1, 5]; `amount` is the texel-step
//                multiplier; sigma is derived from R so the falloff covers
//                the kernel.
//
// All samples go through `applyEdgeHandling` + `unpremultiplyAlpha` so the
// output is plain linear RGB suitable for downstream colour math. `amount`
// scales the offset / radius for the blur modes (sharpness ignores it).
//
// Sample count is a compile-time constant baked into the emitted GLSL —
// changing it triggers a rebuild but lets the loop unroll efficiently.

import { z } from "zod";
import { color, float, uv, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { edgeMode, withMeta, zEdges, zInt } from "@/shaders/core/schemas";
import { floatLit } from "../types";

const MODES = ["kernel-3x3", "linear", "zoom", "angular", "gaussian"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  "kernel-3x3": "Kernel 3×3",
  linear: "Linear",
  zoom: "Zoom",
  angular: "Angular",
  gaussian: "Gaussian",
};

// 3×3 kernel weights (row-major). Default to a mild sharpen so a fresh node
// produces a recognisable result instead of a black frame.
const kernelTuple = z
  .tuple([
    z.number(), z.number(), z.number(),
    z.number(), z.number(), z.number(),
    z.number(), z.number(), z.number(),
  ])
  .default([0, -1, 0, -1, 5, -1, 0, -1, 0]);

const config = z.object({
  mode: withMeta(z.enum(MODES), { enumLabels: MODE_LABEL }).default("kernel-3x3"),
  edges: zEdges().default("stretch").describe("Edges"),
  kernel: kernelTuple.describe("Kernel"),
  samples: zInt(1, 64).default(16).describe("Samples"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  amount: float("Amount", 0.05),
  center: vec2("Center", [0.5, 0.5]),
  // Only meaningful in `linear` mode — degree-valued angle for the sample
  // direction. Kept as a live pin so blur authors can wire angle from
  // GroupInput; ignored entirely by the other modes.
  direction: float("Direction (deg)", 0),
});

const pinOut = z.object({
  out: color("Color"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Sampler extends BaseNode<Config, In, Out> {
  static readonly typeId = "sampler";
  static readonly meta: NodeMeta = {
    name: "Sampler",
    category: "texture",
    color: "#0ea5e9",
    description: "Multi-tap read of u_prevPass — kernel-3x3, linear, zoom, or angular.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("applyEdgeHandling");
    ctx.addDependency("unpremultiplyAlpha");
    // Parse through the Zod schema so defaults (kernel tuple, edges, samples
    // count, direction) are populated when a caller supplies only a partial
    // config object — matches the editor/preset-builder pattern.
    const c = config.parse(ctx.config ?? {}) as Config;
    const u = ctx.inputs.uv;
    const amount = ctx.inputs.amount;
    const center = ctx.inputs.center;
    const o = ctx.outputs.out;
    const edge = edgeMode(c.edges);

    if (c.mode === "gaussian") {
      // Gaussian 2D box. `samples` is the half-width R clamped to [1, 5]
      // (kernel side = 2R+1 → 3, 5, 7, 9, 11). Sigma scales with R so the
      // bell covers the kernel without spilling. Stride is in texels scaled
      // by `amount` so authors get DPR-stable softness.
      const R = Math.max(1, Math.min(5, c.samples));
      const lines: string[] = [];
      lines.push(`vec2 ${o}_ts = 1.0 / u_resolution;`);
      lines.push(`float ${o}_sig = max(float(${R}) * 0.5, 0.5);`);
      lines.push(`float ${o}_sig2 = 2.0 * ${o}_sig * ${o}_sig;`);
      lines.push(`vec3 ${o}_sum = vec3(0.0);`);
      lines.push(`float ${o}_wsum = 0.0;`);
      lines.push(`for (int ${o}_y = -${R}; ${o}_y <= ${R}; ${o}_y++) {`);
      lines.push(`  for (int ${o}_x = -${R}; ${o}_x <= ${R}; ${o}_x++) {`);
      lines.push(`    vec2 ${o}_off = vec2(float(${o}_x), float(${o}_y));`);
      lines.push(`    float ${o}_w = exp(-dot(${o}_off, ${o}_off) / ${o}_sig2);`);
      lines.push(`    vec2 ${o}_uv = ${u} + ${o}_off * ${o}_ts * ${amount};`);
      lines.push(`    ${o}_sum += unpremultiplyAlpha(applyEdgeHandling(u_prevPass, ${o}_uv, ${edge})).rgb * ${o}_w;`);
      lines.push(`    ${o}_wsum += ${o}_w;`);
      lines.push(`  }`);
      lines.push(`}`);
      lines.push(`vec3 ${o} = ${o}_sum / max(${o}_wsum, 1e-6);`);
      return { statements: lines.join("\n") };
    }

    if (c.mode === "kernel-3x3") {
      // Nine taps at ±1 texel offsets, weighted by the kernel. Texel size
      // comes from u_resolution so the effect tracks the canvas DPR.
      const k = c.kernel;
      const taps: string[] = [];
      const offsets: [number, number][] = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],  [0, 0],  [1, 0],
        [-1, 1],  [0, 1],  [1, 1],
      ];
      taps.push(`vec2 ${o}_ts = 1.0 / u_resolution;`);
      taps.push(`vec3 ${o}_sum = vec3(0.0);`);
      for (let i = 0; i < 9; i++) {
        const [dx, dy] = offsets[i];
        const w = k[i];
        if (w === 0) continue;
        taps.push(
          `${o}_sum += unpremultiplyAlpha(applyEdgeHandling(u_prevPass, ${u} + vec2(${dx}.0, ${dy}.0) * ${o}_ts, ${edge})).rgb * ${floatLit(w)};`,
        );
      }
      taps.push(`vec3 ${o} = ${o}_sum;`);
      return { statements: taps.join("\n") };
    }

    // N-sample loop modes. Sample count is baked in as a literal so the
    // driver can unroll.
    const N = c.samples;
    const lines: string[] = [];
    lines.push(`vec3 ${o}_acc = vec3(0.0);`);
    lines.push(`for (int ${o}_i = 0; ${o}_i < ${N}; ${o}_i++) {`);
    lines.push(`  float ${o}_ti = float(${o}_i) / float(${N} - 1);`);

    if (c.mode === "linear") {
      // Sample along a direction vector, centred at `uv`. ti ∈ [0,1] maps to
      // offset [-amount, +amount] along the direction. Direction is a live
      // pin in degrees so authors can drive angle from GroupInput; convert
      // here to radians.
      const angleRad = `(${ctx.inputs.direction} * 0.01745329252)`;
      lines.push(`  vec2 ${o}_dir = vec2(cos(${angleRad}), sin(${angleRad}));`);
      lines.push(`  vec2 ${o}_uv = ${u} + ${o}_dir * (${o}_ti * 2.0 - 1.0) * ${amount};`);
    } else if (c.mode === "zoom") {
      // Mix from center to uv across ti; at ti=1 we're at uv, at ti=0 we're
      // pulled towards center by `amount`.
      lines.push(`  float ${o}_s = mix(1.0 - ${amount}, 1.0, ${o}_ti);`);
      lines.push(`  vec2 ${o}_uv = mix(${center}, ${u}, ${o}_s);`);
    } else if (c.mode === "angular") {
      // Rotate uv around center by an angle ∈ [-amount, +amount] radians.
      lines.push(`  float ${o}_a = (${o}_ti * 2.0 - 1.0) * ${amount};`);
      lines.push(`  vec2 ${o}_d = ${u} - ${center};`);
      lines.push(`  vec2 ${o}_uv = ${center} + mat2(cos(${o}_a), -sin(${o}_a), sin(${o}_a), cos(${o}_a)) * ${o}_d;`);
    }

    lines.push(`  ${o}_acc += unpremultiplyAlpha(applyEdgeHandling(u_prevPass, ${o}_uv, ${edge})).rgb;`);
    lines.push(`}`);
    lines.push(`vec3 ${o} = ${o}_acc / float(${N});`);
    return { statements: lines.join("\n") };
  }
}

export default register(Sampler);
