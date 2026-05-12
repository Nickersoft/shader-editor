// Position — the layer's centered, aspect-corrected surface coordinate. This
// is the convention every existing field-stage uses (vec2 p = (uv - 0.5) * ar)
// so primitives composed over Position match the visual scaling of the
// legacy stage chain.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "P" }];

export default registerPrimitive({
  typeId: "position",
  name: "Position",
  category: "attributes",
  color: "#0ea5e9",
  description: "Centered, aspect-corrected surface coordinate.",
  config,

  inputs() {
    return [];
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return {
      statements: `vec2 ${ctx.outputs.out} = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);`,
    };
  },
});
