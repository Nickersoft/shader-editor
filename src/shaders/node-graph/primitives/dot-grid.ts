// DotGrid — antialiased dot lattice.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(8),
  radius: zFloat(0, 1, 0.005).default(0.3),
  softness: zFloat(0, 1, 0.005).default(0.05),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "dot-grid",
  name: "Dot Grid",
  category: "sources",
  color: "#94a3b8",
  description: "Antialiased dot lattice.",
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
      { nameSuffix: "radius", type: "float", value: c.radius },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_dp = ${p} * ${u.scale};
vec2 ${o}_dc = fract(${o}_dp) - 0.5;
float ${o}_dd = length(${o}_dc);
float ${o}_dr = clamp(${u.radius}, 0.0, 1.0) * 0.5;
float ${o}_ds = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_dd);
float ${o} = 1.0 - smoothstep(${o}_dr, ${o}_dr + ${o}_ds, ${o}_dd);`,
    };
  },
});
