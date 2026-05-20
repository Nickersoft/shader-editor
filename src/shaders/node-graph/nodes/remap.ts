// Remap — balance + contrast on a scalar.

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
  balance: zFloat(-1, 1, 0.01).default(0),
  contrast: zFloat(-1, 4, 0.01).default(0),
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

export class Remap extends BaseNode<Config, In, Out> {
  static readonly typeId = "remap";
  static readonly meta: NodeMeta = {
    name: "Remap",
    category: "converter",
    color: "#a78bfa",
    description: "Balance + contrast on a scalar.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = {
    balance: "float",
    contrast: "float",
  } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const x = ctx.inputs.x;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o}_a = clamp(${x} + ${u.balance} * 0.5, 0.0, 1.0);
float ${o}_c = clamp(${u.contrast} + 1.0, 0.0, 5.0);
float ${o} = clamp((${o}_a - 0.5) * ${o}_c + 0.5, 0.0, 1.0);`,
    };
  }
}

export default register(Remap);
