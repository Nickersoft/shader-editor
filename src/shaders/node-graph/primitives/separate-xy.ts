// SeparateXY — unpack a vec2 into two floats.

import { z } from "zod";
import { float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  v: vec2("V", [0, 0]),
});

const pinOut = z.object({
  x: float("X"),
  y: float("Y"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class SeparateXy extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "separate-xy";
  static readonly meta: PrimitiveMeta = {
    name: "Separate XY",
    category: "vector",
    color: "#a78bfa",
    description: "Unpack a vec2 into two floats.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    return {
      statements: `float ${ctx.outputs.x} = ${ctx.inputs.v}.x;
float ${ctx.outputs.y} = ${ctx.inputs.v}.y;`,
    };
  }
}

export default register(SeparateXy);
