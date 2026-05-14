// CombineXY — pack two floats into a vec2.

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
  x: float("X", 0),
  y: float("Y", 0),
});

const pinOut = z.object({
  out: vec2("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class CombineXy extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "combine-xy";
  static readonly meta: PrimitiveMeta = {
    name: "Combine XY",
    category: "vector",
    color: "#a78bfa",
    description: "Pack two floats into a vec2.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    return { statements: `vec2 ${ctx.outputs.out} = vec2(${ctx.inputs.x}, ${ctx.inputs.y});` };
  }
}

export default register(CombineXy);
