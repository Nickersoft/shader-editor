// Threshold — smoothstep threshold around `level` with `softness` band.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  level: zFloat(0, 1, 0.01).default(0.5),
  softness: zFloat(0, 1, 0.01).default(0.05),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "x", type: "float", label: "X", default: 0 }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "threshold",
  name: "Threshold",
  category: "math",
  color: "#a78bfa",
  description: "Soft threshold (smoothstep band).",
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
      { nameSuffix: "level", type: "float", value: c.level },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const x = ctx.inputs.x;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o} = smoothstep(${u.level} - ${u.softness}, ${u.level} + ${u.softness}, ${x});`,
    };
  },
});
