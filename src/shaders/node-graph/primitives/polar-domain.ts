// PolarDomain — remap `p` to (length·rScale, atan·aScale). Distinct from
// `PolarTransform` (which normalizes the angle and supports a `center`); this
// is the exact legacy field-stage shape, useful for spiral/swirl recipes.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  radialScale: zFloat(0, 20, 0.01).default(1),
  angularScale: zFloat(-20, 20, 0.01).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "vec2", label: "P" }];

export default registerPrimitive({
  typeId: "polar-domain",
  name: "Polar Domain",
  category: "math",
  color: "#a78bfa",
  description: "Map p → (length·rScale, atan·aScale).",
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
      { nameSuffix: "radialScale", type: "float", value: c.radialScale },
      { nameSuffix: "angularScale", type: "float", value: c.angularScale },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o} = vec2(length(${p}) * ${u.radialScale}, atan(${p}.y, ${p}.x) * ${u.angularScale});`,
    };
  },
});
