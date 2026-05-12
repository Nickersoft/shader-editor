// DomainWarp — adds fbm-driven offset to `p`.

import { z } from "zod";
import { zFloat, zInt } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.01, 100, 0.01).default(1),
  amplitude: zFloat(0, 4, 0.01).default(0.5),
  detail: zInt(1, 8).default(4),
  timePhase: zFloat(0, 10, 0.01).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "P" }];

export default registerPrimitive({
  typeId: "domain-warp",
  name: "Domain Warp",
  category: "math",
  color: "#a78bfa",
  description: "fbm-driven offset on a position.",
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
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "amplitude", type: "float", value: c.amplitude },
      { nameSuffix: "timePhase", type: "float", value: c.timePhase },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("fbm");
    ctx.addDependency("simplex2D");
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_wp = ${p} * ${u.scale};
float ${o}_wt = ${t} * ${u.timePhase};
vec2 ${o} = ${p} + ${u.amplitude} * vec2(
  fbm(${o}_wp + vec2(${o}_wt, 0.0), ${c.detail}.0, 2.0, 0.5),
  fbm(${o}_wp + vec2(0.0, ${o}_wt), ${c.detail}.0, 2.0, 0.5)
);`,
    };
  },
});
