// Threshold — smoothstep threshold around `level` with `softness` band.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

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

export class Threshold extends BaseNode<Config, In, Out> {
  static readonly typeId = "threshold";
  static readonly meta: NodeMeta = {
    name: "Threshold",
    category: "converter",
    color: "#a78bfa",
    description: "Soft threshold (smoothstep band).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = {
    level: "float",
    softness: "float",
  } as const;

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
