// CombineColor — pack three floats into a vec3 colour. Mirrors Blender's
// "Combine Color" node. Companion to `separate-color`; together they let
// per-channel adjustments be expressed without bespoke GLSL.

import { z } from "zod";
import { color, float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  r: float("R", 0),
  g: float("G", 0),
  b: float("B", 0),
});

const pinOut = z.object({
  out: color("RGB"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class CombineColor extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "combine-color";
  static readonly meta: PrimitiveMeta = {
    name: "Combine Color",
    category: "converter",
    color: "#a78bfa",
    description: "Pack three floats into a vec3 colour.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    return {
      statements: `vec3 ${ctx.outputs.out} = vec3(${ctx.inputs.r}, ${ctx.inputs.g}, ${ctx.inputs.b});`,
    };
  }
}

export default register(CombineColor);
