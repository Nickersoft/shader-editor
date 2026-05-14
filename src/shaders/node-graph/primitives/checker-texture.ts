// CheckerTexture — alternating 0/1 grid cells.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
  type UniformSpec,
} from "../registry";
import type { GraphNode } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200, 0.1).default(8),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class CheckerTexture extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "checker-texture";
  static readonly meta: PrimitiveMeta = {
    name: "Checker Texture",
    category: "texture",
    color: "#94a3b8",
    description: "Alternating 0/1 grid cells.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [{ nameSuffix: "scale", type: "float", value: c.scale } satisfies UniformSpec];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    return {
      statements: `vec2 ${o}_cp = ${p} * ${ctx.uniforms.scale};
float ${o} = mod(floor(${o}_cp.x) + floor(${o}_cp.y), 2.0);`,
    };
  }
}

export default register(CheckerTexture);
