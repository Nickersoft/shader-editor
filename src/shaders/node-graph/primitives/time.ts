// Time — exposes the global `u_time` uniform as a float output pin.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Time" }];

export default registerPrimitive({
  typeId: "time",
  name: "Time",
  category: "attributes",
  color: "#0ea5e9",
  description: "Elapsed time in seconds.",
  config,

  inputs() {
    return [];
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    return { statements: `float ${ctx.outputs.out} = u_time;` };
  },
});
