// SeparateColor — split a vec3 colour into its three component floats.
// Mirrors Blender's "Separate Color" node. Companion to `combine-color`;
// useful when an adjustment needs to gate or weight individual channels.

import { z } from "zod";
import { color, float } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  v: color("RGB", [0, 0, 0]),
});

const pinOut = z.object({
  r: float("R"),
  g: float("G"),
  b: float("B"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class SeparateColor extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "separate-color";
  static readonly meta: NodeMeta = {
    name: "Separate Color",
    category: "converter",
    color: "#a78bfa",
    description: "Split a vec3 colour into its three component floats.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    return {
      statements: `float ${ctx.outputs.r} = ${ctx.inputs.v}.x;
float ${ctx.outputs.g} = ${ctx.inputs.v}.y;
float ${ctx.outputs.b} = ${ctx.inputs.v}.z;`,
    };
  }
}

export default register(SeparateColor);
