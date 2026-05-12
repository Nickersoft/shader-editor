// GridLines — antialiased line grid.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(8),
  lineWidth: zFloat(0, 1, 0.005).default(0.1),
  softness: zFloat(0, 1, 0.005).default(0.05),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "grid-lines",
  name: "Grid Lines",
  category: "sources",
  color: "#94a3b8",
  description: "Antialiased line grid.",
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
      { nameSuffix: "lineWidth", type: "float", value: c.lineWidth },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_gp = ${p} * ${u.scale};
vec2 ${o}_gf = abs(fract(${o}_gp) - 0.5);
float ${o}_gm = min(${o}_gf.x, ${o}_gf.y);
float ${o}_gw = clamp(${u.lineWidth}, 0.0, 1.0) * 0.5;
float ${o}_gs = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_gm);
float ${o} = 1.0 - smoothstep(${o}_gw, ${o}_gw + ${o}_gs, ${o}_gm);`,
    };
  },
});
