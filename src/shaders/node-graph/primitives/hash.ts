// Hash — deterministic float → float pseudorandom. Wraps the codegen's
// `hash` helper so multiple Hash nodes share the same hashing function
// instead of each inventing its own.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({});

const INPUTS: readonly PinSpec[] = [{ id: "x", type: "float", label: "X", default: 0 }];
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
    // hash() in the helpers operates on vec2; feeding it (x, x*1.7) gives a
    // 1D feed that still keeps the input bits well-mixed.
    ctx.addDependency("hash");
    return {
      statements: `float ${ctx.outputs.out} = hash(vec2(${ctx.inputs.x}, ${ctx.inputs.x} * 1.7));`,
    };
  },
});
