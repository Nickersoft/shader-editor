// Noise — vec2 → float noise. The `kind` config picks the underlying noise
// function; the rest is just sample-point preprocessing (scale + seed
// offset). FBM exposes the extra octave/lacunarity/gain knobs as uniforms.
//
//   white      → high-frequency hash, useful as a static grain
//   value      → smoothed value noise, soft / cell-y
//   simplex    → smoothed simplex noise, the usual default for organic shapes
//   fbm        → fractional Brownian motion (sums octaves of simplex)
//
// `seed` shifts the input point — *not* an extra dimension — so two Noise
// nodes with different seeds produce decorrelated patterns at the same scale.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  kind: z.enum(["white", "value", "simplex", "fbm"]).default("simplex"),
  scale: zFloat(-1000, 1000).default(1),
  seed: zFloat(-1000, 1000).default(0),
  // FBM-only — surfaced unconditionally so the user can flip `kind` without
  // losing previous knob values.
  octaves: z.number().int().min(1).max(8).default(5),
  lacunarity: zFloat(1, 8).default(2),
  gain: zFloat(0, 1).default(0.5),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "noise",
  name: "Noise",
  category: "sources",
  color: "#f97316",
  description: "vec2 → float noise (white / value / simplex / fbm).",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    const out: UniformSpec[] = [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "seed", type: "float", value: c.seed },
    ];
    if (c.kind === "fbm") {
      out.push(
        { nameSuffix: "lacunarity", type: "float", value: c.lacunarity },
        { nameSuffix: "gain", type: "float", value: c.gain },
      );
    }
    return out;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const scale = ctx.uniforms.scale;
    const seed = ctx.uniforms.seed;
    const pExpr = `(${p} * ${scale} + vec2(${seed}, ${seed} * 1.31))`;

    switch (c.kind) {
      case "white":
        ctx.addDependency("hash21");
        return { statements: `float ${o} = hash21(${pExpr});` };
      case "value":
        ctx.addDependency("valueNoise");
        return { statements: `float ${o} = valueNoise(${pExpr});` };
      case "simplex":
        ctx.addDependency("simplex2D");
        // simplex2D returns roughly [-1, 1]; remap to [0, 1] for consistency
        // with the other kinds (downstream colour ramps expect 0..1).
        return { statements: `float ${o} = simplex2D(${pExpr}) * 0.5 + 0.5;` };
      case "fbm": {
        ctx.addDependency("fbm");
        const octaves = `${c.octaves}.0`;
        const lac = ctx.uniforms.lacunarity;
        const gain = ctx.uniforms.gain;
        return {
          statements: `float ${o} = fbm(${pExpr}, ${octaves}, ${lac}, ${gain}) * 0.5 + 0.5;`,
        };
      }
    }
  },
});
