// ScreenUV — raw surface UV in [0,1]², without the aspect-correcting recentering
// that `texture-coordinate` applies. This is what effect graphs want when they
// sample u_prevPass: the current pixel's UV in the previous pass's framebuffer.
// `texture-coordinate` stays the right input for procedural fields, which want
// a centered, aspect-aware coordinate.

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
  uv: vec2("UV"),
});

type Out = z.infer<typeof pinOut>;

export class ScreenUV extends BaseNode<Record<string, never>, Record<string, never>, Out> {
  static readonly typeId = "screen-uv";
  static readonly meta: NodeMeta = {
    name: "Screen UV",
    category: "input",
    color: "#0ea5e9",
    description: "Raw surface UV in [0,1]² — the current pixel's coordinate.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return {
      statements: `vec2 ${ctx.outputs.uv} = uv;`,
    };
  }
}

export default register(ScreenUV);
