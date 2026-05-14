// NoiseTexture — vec2 → float noise. The `kind` config picks the underlying
// noise function; remaining knobs match Blender's Noise Texture node naming.
//
//   white      → high-frequency hash, useful as a static grain
//   value      → smoothed value noise, soft / cell-y
//   simplex    → smoothed simplex noise, the usual default for organic shapes
//   fbm        → fractional Brownian motion (sums octaves of simplex)
//
// `seed` shifts the input point; `t` adds a per-frame offset (defaults to 0
// when unwired). `distortion` warps the sample point by a simplex offset
// before sampling — only meaningful for kind="fbm" but exposed unconditionally
// so flipping kind preserves knob values.

import { z } from "zod";
import { zFloat, zInt } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
  type UniformSpec,
} from "../registry";
import type { GraphNode } from "../types";

const config = z.object({
  kind: z.enum(["white", "value", "simplex", "fbm"]).default("simplex"),
  scale: zFloat(-1000, 1000).default(1),
  seed: zFloat(-1000, 1000).default(0),
  detail: zInt(1, 8).default(5),
  lacunarity: zFloat(1, 8, 0.01).default(2),
  roughness: zFloat(0, 1, 0.01).default(0.5),
  distortion: zFloat(0, 4, 0.01).default(0),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
  t: float("Time", 0),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class NoiseTexture extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "noise-texture";
  static readonly meta: PrimitiveMeta = {
    name: "Noise Texture",
    category: "texture",
    color: "#f97316",
    description: "vec2 → float noise (white / value / simplex / fbm).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    const out: UniformSpec[] = [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "seed", type: "float", value: c.seed },
    ];
    if (c.kind === "fbm") {
      out.push(
        { nameSuffix: "lacunarity", type: "float", value: c.lacunarity },
        { nameSuffix: "roughness", type: "float", value: c.roughness },
      );
      if (c.distortion !== 0) {
        out.push({ nameSuffix: "distortion", type: "float", value: c.distortion });
      }
    }
    return out;
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const scale = ctx.uniforms.scale;
    const seed = ctx.uniforms.seed;
    const pBase = `(${p} * ${scale} + vec2(${seed}, ${seed} * 1.31) + ${t})`;

    switch (c.kind) {
      case "white":
        ctx.addDependency("hash21");
        return { statements: `float ${o} = hash21(${pBase});` };
      case "value":
        ctx.addDependency("valueNoise");
        return { statements: `float ${o} = valueNoise(${pBase});` };
      case "simplex":
        ctx.addDependency("simplex2D");
        // simplex2D returns roughly [-1, 1]; remap to [0, 1] for consistency
        // with the other kinds (downstream colour ramps expect 0..1).
        return { statements: `float ${o} = simplex2D(${pBase}) * 0.5 + 0.5;` };
      case "fbm": {
        ctx.addDependency("fbm");
        const detail = `${c.detail}.0`;
        const lac = ctx.uniforms.lacunarity;
        const rough = ctx.uniforms.roughness;
        if (c.distortion !== 0) {
          ctx.addDependency("simplex2D");
          const dist = ctx.uniforms.distortion;
          return {
            statements: `vec2 ${o}_np = ${pBase};
${o}_np += ${dist} * vec2(simplex2D(${o}_np + vec2(13.7, 0.0)), simplex2D(${o}_np + vec2(0.0, 41.3)));
float ${o} = fbm(${o}_np, ${detail}, ${lac}, ${rough}) * 0.5 + 0.5;`,
          };
        }
        return {
          statements: `float ${o} = fbm(${pBase}, ${detail}, ${lac}, ${rough}) * 0.5 + 0.5;`,
        };
      }
    }
  }
}

export default register(NoiseTexture);
