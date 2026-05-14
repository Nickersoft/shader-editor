// Threshold — smoothstep threshold around `level` with `softness` band.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float } from "../pins";
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
  level: zFloat(0, 1, 0.01).default(0.5),
  softness: zFloat(0, 1, 0.01).default(0.05),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  x: float("X", 0),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class Threshold extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "threshold";
  static readonly meta: PrimitiveMeta = {
    name: "Threshold",
    category: "converter",
    color: "#a78bfa",
    description: "Soft threshold (smoothstep band).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "level", type: "float", value: c.level },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const x = ctx.inputs.x;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o} = smoothstep(${u.level} - ${u.softness}, ${u.level} + ${u.softness}, ${x});`,
    };
  }
}

export default register(Threshold);
