// FieldSource — the legacy chain's `p`/`t` setup stage in primitive form.
// Outputs a scaled-and-shifted copy of `p` plus a time-rescaled `t`.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.01, 200, 0.01).default(2),
  speed: zFloat(0, 4, 0.01).default(1),
  seed: zFloat(0, 1000, 0.1).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P" },
  { id: "t", type: "float", label: "T" },
];

export default registerPrimitive({
  typeId: "field-source",
  name: "Field Source",
  category: "math",
  color: "#a78bfa",
  description: "Scale + seed a position, rescale time.",
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
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "speed", type: "float", value: c.speed },
      { nameSuffix: "seed", type: "float", value: c.seed },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${ctx.outputs.p} = ${ctx.inputs.p} * ${u.scale} + ${u.seed};
float ${ctx.outputs.t} = ${ctx.inputs.t} * ${u.speed} * 0.15;`,
    };
  },
});
