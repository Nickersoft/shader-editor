// RippleWave — animated concentric ripple.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  frequency: zFloat(1, 200, 1).default(20),
  speed: zFloat(0, 4, 0.05).default(1),
  phase: zFloat(0, 6.2832, 0.01).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "ripple-wave",
  name: "Ripple Wave",
  category: "sources",
  color: "#22d3ee",
  description: "Animated concentric ripple.",
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
      { nameSuffix: "frequency", type: "float", value: c.frequency },
      { nameSuffix: "speed", type: "float", value: c.speed },
      { nameSuffix: "phase", type: "float", value: c.phase },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o}_r = length(${p});
float ${o}_w = ${o}_r * ${u.frequency} - ${t} * ${u.speed} * 4.0 + ${u.phase};
float ${o} = 0.5 + 0.5 * cos(${o}_w);`,
    };
  },
});
