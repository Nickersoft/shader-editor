// Resolution — the render target's pixel dimensions. Rarely the right answer
// inside a procedural field (where aspect-corrected `Position` is usually what
// you want), but exposed for pixel-grid and pixel-art use cases.

import { z } from "zod";
import { vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinOut = z.object({
  out: vec2("Resolution"),
});

type Out = z.infer<typeof pinOut>;

class Resolution extends BasePrimitive<Record<string, never>, Record<string, never>, Out> {
  static readonly typeId = "resolution";
  static readonly meta: PrimitiveMeta = {
    name: "Resolution",
    category: "input",
    color: "#0ea5e9",
    description: "Render-target resolution in pixels.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return { statements: `vec2 ${ctx.outputs.out} = u_resolution;` };
  }
}

export default register(Resolution);
