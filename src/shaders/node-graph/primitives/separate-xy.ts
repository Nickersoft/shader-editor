// SeparateXY — unpack a vec2 into two floats.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [{ id: "v", type: "vec2", label: "V", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [
  { id: "x", type: "float", label: "X" },
  { id: "y", type: "float", label: "Y" },
];

export default registerPrimitive({
  typeId: "separate-xy",
  name: "Separate XY",
  category: "math",
  color: "#a78bfa",
  description: "Unpack a vec2 into two floats.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `float ${ctx.outputs.x} = ${ctx.inputs.v}.x;
float ${ctx.outputs.y} = ${ctx.inputs.v}.y;`,
    };
  },
});
