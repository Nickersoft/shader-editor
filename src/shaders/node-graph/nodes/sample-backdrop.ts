// SampleBackdrop — sample `u_backdrop` at an arbitrary UV. The backdrop is
// the composite of every layer below the current layer in the scene, and is
// only populated when the containing Effect declares `static needsBackdrop`.
// Used by shape effects (Glass, etc.) that refract what sits beneath their
// own shape.

import { z } from "zod";
import { color, float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  uv: vec2("UV", [0.5, 0.5]),
});

const pinOut = z.object({
  color: color("Color"),
  alpha: float("Alpha"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class SampleBackdrop extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "sample-backdrop";
  static readonly meta: NodeMeta = {
    name: "Sample Backdrop",
    category: "texture",
    color: "#0ea5e9",
    description:
      "Sample the composite of every layer below the current one. Requires the containing effect to declare needsBackdrop.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const tmp = `${ctx.outputs.color}_sample`;
    return {
      statements: `vec4 ${tmp} = texture(u_backdrop, ${ctx.inputs.uv});
vec3 ${ctx.outputs.color} = ${tmp}.rgb;
float ${ctx.outputs.alpha} = ${tmp}.a;`,
    };
  }
}

export default register(SampleBackdrop);
