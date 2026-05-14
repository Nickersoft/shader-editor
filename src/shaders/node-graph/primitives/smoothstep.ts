// SmoothStep — GLSL `smoothstep(edge0, edge1, x)` as a 3-pin primitive.
//
// Combine has a 2-input `smoothstep` op but it hardcodes the third argument
// to 0.5 (using the two inputs as edge0/edge1). Decomposed SDF-style recipes
// generally compute their own edges from other pins, so this primitive
// surfaces the full signature.

import { z } from "zod";
import { float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  edge0: float("Edge 0", 0),
  edge1: float("Edge 1", 1),
  x: float("X", 0),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class Smoothstep extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "smoothstep";
  static readonly meta: PrimitiveMeta = {
    name: "Smoothstep",
    category: "converter",
    color: "#a78bfa",
    description: "GLSL smoothstep(edge0, edge1, x) — 0 below edge0, 1 above edge1, smooth between.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    return {
      statements: `float ${ctx.outputs.out} = smoothstep(${ctx.inputs.edge0}, ${ctx.inputs.edge1}, ${ctx.inputs.x});`,
    };
  }
}

export default register(Smoothstep);
