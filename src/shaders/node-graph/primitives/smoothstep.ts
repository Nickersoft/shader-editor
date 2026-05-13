// SmoothStep — GLSL `smoothstep(edge0, edge1, x)` as a 3-pin primitive.
//
// Combine has a 2-input `smoothstep` op but it hardcodes the third argument
// to 0.5 (using the two inputs as edge0/edge1). Decomposed SDF-style recipes
// generally compute their own edges from other pins, so this primitive
// surfaces the full signature.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "edge0", type: "float", label: "Edge 0", default: 0 },
  { id: "edge1", type: "float", label: "Edge 1", default: 1 },
  { id: "x", type: "float", label: "X", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "smoothstep",
  name: "Smooth Step",
  category: "math",
  color: "#a78bfa",
  description: "GLSL smoothstep(edge0, edge1, x) — 0 below edge0, 1 above edge1, smooth between.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `float ${ctx.outputs.out} = smoothstep(${ctx.inputs.edge0}, ${ctx.inputs.edge1}, ${ctx.inputs.x});`,
    };
  },
});
