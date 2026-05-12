// VoronoiSample — full-featured voronoi (feature/metric/smoothness, time
// jitter). Direct port of the legacy field-stage; preset-compatible.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import type { GlslHelperName } from "@/shaders/core/types";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  feature: z.enum(["f1", "f2", "smooth-f1", "distance-to-edge"]).default("f1"),
  metric: z.enum(["euclidean", "manhattan", "chebychev"]).default("euclidean"),
  randomness: zFloat(0, 1, 0.01).default(1),
  smoothness: zFloat(0, 1, 0.01).default(0.25),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "voronoi-sample",
  name: "Voronoi Sample",
  category: "sources",
  color: "#06b6d4",
  description: "Voronoi (f1/f2/smooth/edge) with metric + time jitter.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [
      { nameSuffix: "randomness", type: "float", value: c.randomness },
      { nameSuffix: "smoothness", type: "float", value: c.smoothness },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const c = ctx.config as Config;
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
  },
});
