// MagicTexture — recursive sin/cos pattern. `depth` is structural so the
// unrolled loop becomes a compile-time constant.

import { z } from "zod";
import { zFloat, zInt } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  depth: zInt(0, 10).default(2),
  scale: zFloat(0.1, 16, 0.1).default(5),
  distortion: zFloat(0, 4, 0.01).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [
  { id: "p", type: "vec2", label: "P", default: [0, 0] },
  { id: "t", type: "float", label: "T", default: 0 },
];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "magic-texture",
  name: "Magic Texture",
  category: "sources",
  color: "#a78bfa",
  description: "Recursive sin/cos pattern.",
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
      { nameSuffix: "distortion", type: "float", value: c.distortion },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    const depth = Math.max(0, Math.min(10, Math.floor(c.depth)));
    const iters: string[] = [];
    for (let i = 0; i < depth; i++) {
      iters.push(`${o}_x = sin(${o}_x * ${o}_y + ${o}_t);
${o}_y = cos(${o}_x + ${o}_y + ${o}_t);
${o}_x *= ${o}_d;
${o}_y *= ${o}_d;`);
    }
    return {
      statements: `vec2 ${o}_p = ${p} * ${u.scale};
float ${o}_t = ${t} * 0.5;
float ${o}_d = ${u.distortion};
float ${o}_x = sin((${o}_p.x + ${o}_p.y) * 5.0 + ${o}_t);
float ${o}_y = cos((${o}_p.x - ${o}_p.y) * 5.0 - ${o}_t);
${iters.join("\n")}
float ${o} = clamp(0.5 + 0.5 * (sin(${o}_x + ${o}_y) + cos(${o}_x - ${o}_y)) * 0.5, 0.0, 1.0);`,
    };
  },
});
