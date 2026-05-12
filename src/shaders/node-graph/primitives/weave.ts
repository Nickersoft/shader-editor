// Weave — over/under thread weave pattern.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 80, 0.1).default(10),
  gap: zFloat(0, 0.5, 0.005).default(0.25),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "weave",
  name: "Weave",
  category: "sources",
  color: "#0ea5e9",
  description: "Over/under thread weave.",
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
      { nameSuffix: "gap", type: "float", value: c.gap },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("aastep");
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_q = ${p} * ${u.scale};
vec2 ${o}_c = floor(${o}_q);
vec2 ${o}_f = fract(${o}_q) - 0.5;
bool ${o}_over = mod(${o}_c.x + ${o}_c.y, 2.0) < 0.5;
float ${o}_th = (0.5 - clamp(${u.gap}, 0.0, 0.5)) * 0.5 + 0.05;
float ${o}_h = 1.0 - aastep(${o}_th, abs(${o}_f.y));
float ${o}_v = 1.0 - aastep(${o}_th, abs(${o}_f.x));
float ${o}_am = ${o}_over ? ${o}_h : ${o}_h * 0.5;
float ${o}_bm = ${o}_over ? ${o}_v * 0.5 : ${o}_v;
float ${o} = max(${o}_am, ${o}_bm);`,
    };
  },
});
