// VoronoiTexture — cellular noise with selectable feature and distance metric,
// matching Blender's Voronoi Texture node.
//
//   feature:    f1            → distance to nearest point
//               f2            → distance to second-nearest point
//               smooth-f1     → smooth-min over all neighbours (k = smoothness)
//               distance-to-edge → 1 − (f2 − f1)/2, the perpendicular bisector distance
//   metric:     euclidean | manhattan | chebychev
//
// Inputs are `p` (sample point) and an optional `t` (per-frame jitter on the
// per-cell point positions). `randomness` interpolates between a regular grid
// (0) and fully hashed jitter (1). `smoothness` only matters for smooth-f1.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import type { GlslHelperName } from "@/shaders/core/types";
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
  feature: z.enum(["f1", "f2", "smooth-f1", "distance-to-edge"]).default("f1"),
  metric: z.enum(["euclidean", "manhattan", "chebychev"]).default("euclidean"),
  randomness: zFloat(0, 1, 0.01).default(1),
  smoothness: zFloat(0, 1, 0.01).default(0.25),
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

class VoronoiTexture extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "voronoi-texture";
  static readonly meta: PrimitiveMeta = {
    name: "Voronoi Texture",
    category: "texture",
    color: "#06b6d4",
    description: "Cellular noise (f1/f2/smooth/edge) with metric + time jitter.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "randomness", type: "float", value: c.randomness },
      { nameSuffix: "smoothness", type: "float", value: c.smoothness },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;

    let distExpr: string;
    switch (c.metric) {
      case "manhattan":
        distExpr = `(abs(${o}_dv.x) + abs(${o}_dv.y))`;
        break;
      case "chebychev":
        distExpr = `max(abs(${o}_dv.x), abs(${o}_dv.y))`;
        break;
      default:
        distExpr = `length(${o}_dv)`;
    }

    const needsD2 = c.feature === "f2" || c.feature === "distance-to-edge";
    const needsSmin = c.feature === "smooth-f1";

    let featureWrite: string;
    switch (c.feature) {
      case "f2":
        featureWrite = `float ${o} = clamp(${o}_d2, 0.0, 1.0);`;
        break;
      case "smooth-f1":
        featureWrite = `float ${o} = clamp(${o}_sm, 0.0, 1.0);`;
        break;
      case "distance-to-edge":
        featureWrite = `float ${o} = clamp(1.0 - (${o}_d2 - ${o}_d1) * 0.5, 0.0, 1.0);`;
        break;
      default:
        featureWrite = `float ${o} = clamp(${o}_d1, 0.0, 1.0);`;
    }

    const d2Decl = needsD2 ? `float ${o}_d2 = 10.0;` : ``;
    const sminDecl = needsSmin
      ? `float ${o}_sm = 10.0;\nfloat ${o}_k = max(${u.smoothness}, 1e-4);`
      : ``;
    const sminUpdate = needsSmin ? `\n      ${o}_sm = smin(${o}_sm, ${o}_d, ${o}_k);` : ``;
    const d2Update = needsD2
      ? `if (${o}_d < ${o}_d1) { ${o}_d2 = ${o}_d1; ${o}_d1 = ${o}_d; } else if (${o}_d < ${o}_d2) { ${o}_d2 = ${o}_d; }`
      : `${o}_d1 = min(${o}_d1, ${o}_d);`;

    ctx.addDependency("hash22");
    const deps: GlslHelperName[] = [];
    if (needsSmin) ctx.addDependency("smin");
    void deps;

    return {
      statements: `vec2 ${o}_cell = floor(${p});
vec2 ${o}_local = fract(${p});
float ${o}_d1 = 10.0;
${d2Decl}
${sminDecl}
for (int ${o}_ny = -1; ${o}_ny <= 1; ${o}_ny++) {
  for (int ${o}_nx = -1; ${o}_nx <= 1; ${o}_nx++) {
    vec2 ${o}_off = vec2(float(${o}_nx), float(${o}_ny));
    vec2 ${o}_h = hash22(${o}_cell + ${o}_off);
    vec2 ${o}_pt = mix(vec2(0.5), ${o}_h, ${u.randomness});
    ${o}_pt.x = clamp(${o}_pt.x + sin(${t} + ${o}_h.x * 6.28) * 0.15 * ${u.randomness}, 0.0, 1.0);
    ${o}_pt.y = clamp(${o}_pt.y + cos(${t} * 0.7 + ${o}_h.y * 6.28) * 0.15 * ${u.randomness}, 0.0, 1.0);
    vec2 ${o}_dv = ${o}_local - (${o}_off + ${o}_pt);
    float ${o}_d = ${distExpr};${sminUpdate}
    ${d2Update}
  }
}
${featureWrite}`,
    };
  }
}

export default register(VoronoiTexture);
