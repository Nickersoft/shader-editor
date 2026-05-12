// RadialDistance — distance from `p` to `center`. Equivalent to
// `length(p - center)`; ships as its own primitive because radial falloff is
// common enough that a single node is much more legible than two.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "center", type: "vec2", label: "Center", default: [0, 0] },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Distance" }];

export default registerPrimitive({
  typeId: "radial-distance",
  name: "Radial Distance",
  category: "sources",
  color: "#f97316",
  description: "Distance from a point to a center.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `float ${ctx.outputs.out} = length(${ctx.inputs.p} - ${ctx.inputs.center});`,
    };
  },
});
