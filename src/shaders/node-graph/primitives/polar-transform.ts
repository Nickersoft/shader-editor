// PolarTransform — converts `p - center` into polar coordinates.
//
// Output is a vec2 with `.x = radius`, `.y = angle/2π + 0.5` (i.e. the angle
// normalized to `[0, 1]` and recentered so straight-right is 0.5). Pair with
// SeparateXY when downstream needs the components individually.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "center", type: "vec2", label: "Center", default: [0, 0] },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "(r, angle01)" }];

export default registerPrimitive({
  typeId: "polar-transform",
  name: "Polar Transform",
  category: "sources",
  color: "#f97316",
  description: "Convert (p - center) into (radius, normalized-angle).",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    const o = ctx.outputs.out;
    const p = ctx.inputs.p;
    const c = ctx.inputs.center;
    return {
      statements: `vec2 ${o}_d = ${p} - ${c};
vec2 ${o} = vec2(length(${o}_d), atan(${o}_d.y, ${o}_d.x) / 6.2831853 + 0.5);`,
    };
  },
});
