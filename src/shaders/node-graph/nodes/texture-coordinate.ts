// Position — the layer's centered, aspect-corrected surface coordinate. This
// is the convention every existing field-stage uses (vec2 p = (uv - 0.5) * ar)
// so primitives composed over Position match the visual scaling of the
// legacy stage chain.

import { z } from "zod";
import { vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinOut = z.object({
  out: vec2("Position"),
});

type Out = z.infer<typeof pinOut>;

export class Position extends BaseNode<Record<string, never>, Record<string, never>, Out> {
  static readonly typeId = "texture-coordinate";
  static readonly meta: NodeMeta = {
    name: "Texture Coordinate",
    category: "input",
    color: "#0ea5e9",
    description: "Centered, aspect-corrected surface coordinate.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return {
      statements: `vec2 ${ctx.outputs.out} = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);`,
    };
  }
}

export default register(Position);
