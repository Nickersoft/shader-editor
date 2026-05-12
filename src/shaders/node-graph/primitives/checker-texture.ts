// CheckerTexture — alternating 0/1 grid cells.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(8),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "checker-texture",
  name: "Checker",
  category: "sources",
  color: "#94a3b8",
  description: "Alternating 0/1 grid cells.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [{ nameSuffix: "scale", type: "float", value: c.scale } satisfies UniformSpec];
  },

  emit(ctx) {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    return {
      statements: `vec2 ${o}_cp = ${p} * ${ctx.uniforms.scale};
float ${o} = mod(floor(${o}_cp.x) + floor(${o}_cp.y), 2.0);`,
    };
  },
});
