// GodRays — monolithic radial-rays primitive. The hand-decomposed equivalent
// lives in `test-graphs.ts::godRaysGraph` (Phase 2 gate); this version exists
// for preset compatibility and as a single-node shorthand. Outputs scalar `n`
// suitable for piping into ColorRamp.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  density: zFloat(0, 1, 0.01).default(0.3),
  decay: zFloat(0, 4, 0.01).default(0.6),
  weight: zFloat(0, 1, 0.01).default(0.8),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "center", type: "vec2", label: "Center", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "god-rays",
  name: "God Rays",
  category: "sources",
  color: "#facc15",
  description: "Sun-radial rays mask.",
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
      { nameSuffix: "density", type: "float", value: c.density },
      { nameSuffix: "decay", type: "float", value: c.decay },
      { nameSuffix: "weight", type: "float", value: c.weight },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("valueNoise");
    const p = ctx.inputs.p;
    const center = ctx.inputs.center;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_d = ${p} - ${center};
float ${o}_r = length(${o}_d);
float ${o}_a = atan(${o}_d.y, ${o}_d.x);
float ${o}_f = ${u.density} * 30.0 + 1.0;
float ${o}_n1 = valueNoise(vec2(${o}_a * ${o}_f, ${o}_r * 2.0 - ${t} * 0.6));
float ${o}_n2 = valueNoise(vec2(${o}_a * ${o}_f * 2.5, ${o}_r * 1.2 - ${t} * 0.4));
float ${o}_w = 4.0 - 3.0 * clamp(${u.weight}, 0.0, 1.0);
float ${o}_p = pow(clamp(${o}_n1 * ${o}_n2, 0.0, 1.0), ${o}_w);
float ${o}_dec = exp(-${o}_r * ${u.decay});
float ${o} = clamp(${o}_p * ${o}_dec, 0.0, 1.0);`,
    };
  },
});
