// Truchet — random quarter-arc tile mask.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 80, 0.1).default(10),
  lineWidth: zFloat(0, 8, 0.05).default(2),
  seed: zFloat(0, 100, 1).default(0),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "truchet",
  name: "Truchet",
  category: "sources",
  color: "#0ea5e9",
  description: "Random quarter-arc tile mask.",
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
      { nameSuffix: "seed", type: "float", value: c.seed },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("aastep");
    ctx.addDependency("hash");
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_q = ${p} * ${u.scale};
vec2 ${o}_c = floor(${o}_q);
vec2 ${o}_f = fract(${o}_q);
float ${o}_h = hash(${o}_c + ${u.seed});
if (${o}_h < 0.5) ${o}_f = vec2(${o}_f.x, 1.0 - ${o}_f.y);
float ${o}_d1 = abs(length(${o}_f) - 0.5);
float ${o}_d2 = abs(length(${o}_f - vec2(1.0)) - 0.5);
float ${o}_dd = min(${o}_d1, ${o}_d2);
float ${o}_lw = clamp(${u.lineWidth}, 0.0, 8.0) * 0.025;
float ${o} = 1.0 - aastep(${o}_lw, ${o}_dd);`,
    };
  },
});
