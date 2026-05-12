// CombineXY — pack two floats into a vec2.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "x", type: "float", label: "X", default: 0 },
  { id: "y", type: "float", label: "Y", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "Out" }];

export default registerPrimitive({
  typeId: "combine-xy",
  name: "Combine XY",
  category: "math",
  color: "#a78bfa",
  description: "Pack two floats into a vec2.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return { statements: `vec2 ${ctx.outputs.out} = vec2(${ctx.inputs.x}, ${ctx.inputs.y});` };
  },
});
