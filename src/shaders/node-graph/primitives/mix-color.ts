// MixColor — `mix(a, b, t)` over vec3 colors. Convenience for the composite
// effects whose `(color, alpha)` outputs need blending onto a background.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "a", type: "vec3", label: "A", default: [0, 0, 0] },
  { id: "b", type: "vec3", label: "B", default: [1, 1, 1] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec3", label: "Out" }];

export default registerPrimitive({
  typeId: "mix-color",
  name: "Mix Color",
  category: "math",
  color: "#ec4899",
  description: "Linear blend between two colors.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `vec3 ${ctx.outputs.out} = mix(${ctx.inputs.a}, ${ctx.inputs.b}, clamp(${ctx.inputs.t}, 0.0, 1.0));`,
    };
  },
});
