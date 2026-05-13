// Hash — deterministic vec2 → float pseudorandom. Wraps the codegen's
// `hash` helper directly — the underlying function takes a vec2, so the pin
// shape matches and recipes that already have a vec2 (a cell coordinate, a
// transformed `p`) can wire straight through.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "hash",
  name: "Hash",
  category: "sources",
  color: "#f97316",
  description: "Deterministic pseudorandom float in [0,1].",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  emit(ctx) {
    ctx.addDependency("hash");
    return {
      statements: `float ${ctx.outputs.out} = hash(${ctx.inputs.p});`,
    };
  },
});
