// FbmSample — fbm of `(p + t)` with optional distortion warp.

import { z } from "zod";
import { zFloat, zInt } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  detail: zInt(1, 8).default(5),
  lacunarity: zFloat(1, 8, 0.01).default(2),
  roughness: zFloat(0, 1, 0.01).default(0.5),
  distortion: zFloat(0, 4, 0.01).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "fbm-sample",
  name: "FBM Sample",
  category: "sources",
  color: "#0ea5e9",
  description: "fbm noise (with optional distortion).",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    const u: UniformSpec[] = [
      { nameSuffix: "lacunarity", type: "float", value: c.lacunarity },
      { nameSuffix: "roughness", type: "float", value: c.roughness },
    ];
    if (c.distortion !== 0) u.push({ nameSuffix: "distortion", type: "float", value: c.distortion });
    return u;
  },

  emit(ctx) {
    ctx.addDependency("fbm");
    ctx.addDependency("simplex2D");
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const warp =
      c.distortion === 0
        ? ""
        : `\n${o}_np += ${ctx.uniforms.distortion} * vec2(simplex2D(${o}_np + vec2(13.7, 0.0)), simplex2D(${o}_np + vec2(0.0, 41.3)));`;
    return {
      statements: `vec2 ${o}_np = ${p} + ${t};${warp}
float ${o} = 0.5 + 0.5 * fbm(${o}_np, ${c.detail}.0, ${ctx.uniforms.lacunarity}, ${ctx.uniforms.roughness});`,
    };
  },
});
