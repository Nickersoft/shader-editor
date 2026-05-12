// Resolution — the render target's pixel dimensions. Rarely the right answer
// inside a procedural field (where aspect-corrected `Position` is usually what
// you want), but exposed for pixel-grid and pixel-art use cases.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "Resolution" }];

export default registerPrimitive({
  typeId: "resolution",
  name: "Resolution",
  category: "attributes",
  color: "#0ea5e9",
  description: "Render-target resolution in pixels.",
  config,

  inputs() {
    return [];
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return { statements: `vec2 ${ctx.outputs.out} = u_resolution;` };
  },
});
