// GroupOutput — the single sink of the graph. The emitter reads its `color`
// input expression and builds the final `return vec4(<color>, 1.0);`.
//
// emit() still writes a sentinel local so the node participates in topo order
// like any other; the emitter's final-return path inlines the upstream local
// directly to keep the emitted GLSL one line shorter.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [
  { id: "color", type: "vec3", label: "Color", default: [0, 0, 0] },
];

export default registerPrimitive({
  typeId: "group-output",
  name: "Group Output",
  category: "io",
  color: "#ef4444",
  description: "Final color routed to the layer.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return [];
  },

  emit(ctx) {
    // Sentinel local — unused by the emitter's final-return path, but present
    // so other tooling (debug dumps, future passes) can inspect the value.
    return { statements: `vec3 _final_color = ${ctx.inputs.color};` };
  },
});
