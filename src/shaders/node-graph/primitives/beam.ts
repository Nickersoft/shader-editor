// Beam — directional beam mask.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  angle: zFloat(-360, 360, 1).default(0),
  width: zFloat(0, 1, 0.005).default(0.2),
  softness: zFloat(0, 1, 0.005).default(0.3),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "beam",
  name: "Beam",
  category: "sources",
  color: "#fde68a",
  description: "Directional beam mask.",
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
      { nameSuffix: "angle", type: "float", value: c.angle },
      { nameSuffix: "width", type: "float", value: c.width },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o}_ba = radians(${u.angle});
vec2 ${o}_bn = vec2(-sin(${o}_ba), cos(${o}_ba));
float ${o}_bd = abs(dot(${p}, ${o}_bn));
float ${o}_bw = clamp(${u.width}, 0.0, 1.0) * 0.5;
float ${o}_bs = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_bd);
float ${o} = 1.0 - smoothstep(${o}_bw, ${o}_bw + ${o}_bs, ${o}_bd);`,
    };
  },
});
