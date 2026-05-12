// Remap — balance + contrast on a scalar.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  balance: zFloat(-1, 1, 0.01).default(0),
  contrast: zFloat(-1, 4, 0.01).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "x", type: "float", label: "X", default: 0 }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "remap",
  name: "Remap",
  category: "math",
  color: "#a78bfa",
  description: "Balance + contrast on a scalar.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [
      { nameSuffix: "balance", type: "float", value: c.balance },
      { nameSuffix: "contrast", type: "float", value: c.contrast },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const x = ctx.inputs.x;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o}_a = clamp(${x} + ${u.balance} * 0.5, 0.0, 1.0);
float ${o}_c = clamp(${u.contrast} + 1.0, 0.0, 5.0);
float ${o} = clamp((${o}_a - 0.5) * ${o}_c + 0.5, 0.0, 1.0);`,
    };
  },
});
