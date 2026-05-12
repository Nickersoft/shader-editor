// PlasmaSample — classic 4-sine plasma. Direct port of the legacy field stage.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  intensity: zFloat(0, 4, 0.05).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "plasma-sample",
  name: "Plasma",
  category: "sources",
  color: "#22d3ee",
  description: "Classic 4-sine plasma field.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [{ nameSuffix: "intensity", type: "float", value: c.intensity } satisfies UniformSpec];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    return {
      statements: `float ${o}_v = sin(${p}.x + ${t})
  + sin(${p}.y * 0.7 + ${t} * 1.3)
  + sin((${p}.x + ${p}.y) * 0.6 + ${t} * 0.9)
  + sin(length(${p}) - ${t});
${o}_v *= 0.25 * ${ctx.uniforms.intensity};
float ${o} = clamp(0.5 + 0.5 * ${o}_v, 0.0, 1.0);`,
    };
  },
});
