// Angle — `atan2(p.y, p.x)` of the centered surface coordinate, normalized to
// `[0, 1]`. Zero inputs by spec; the GLSL recomputes `p` from `uv` rather than
// taking it as a pin, so a graph that wants `angle(p - center)` should compose
// PolarTransform instead.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Angle" }];

export default registerPrimitive({
  typeId: "angle",
  name: "Angle",
  category: "attributes",
  color: "#0ea5e9",
  description: "Polar angle of the surface coordinate, normalized to 0..1.",
  config,

  inputs() {
    return [];
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `vec2 _ang_p_${ctx.outputs.out} = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
float ${ctx.outputs.out} = atan(_ang_p_${ctx.outputs.out}.y, _ang_p_${ctx.outputs.out}.x) / 6.2831853 + 0.5;`,
    };
  },
});
