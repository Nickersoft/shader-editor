// Mouse — exposes the global `u_mouse` and `u_mouseDelta` uniforms as graph
// outputs. `u_mouse` is the normalized cursor position in screen UV space
// ([0,1]², top-left origin matching the canvas). `u_mouseDelta` is the
// per-frame velocity (in UV units), used by interactive effects to scale
// drift / impact strength with how fast the user is moving.
//
// Emit references both uniforms unconditionally — the fragment codegen's
// uniform-decl pass detects `u_mouse` / `u_mouseDelta` token usage and adds
// the appropriate `uniform vec2 …;` lines, so simply mentioning them in the
// emitted GLSL is sufficient.

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
  position: vec2("Position", [0.5, 0.5]),
  delta: vec2("Delta", [0, 0]),
});

type Out = z.infer<typeof pinOut>;

class Mouse extends BasePrimitive<Record<string, never>, Record<string, never>, Out> {
  static readonly typeId = "mouse";
  static readonly meta: PrimitiveMeta = {
    name: "Mouse",
    category: "input",
    color: "#0ea5e9",
    description: "Cursor position (UV) and per-frame velocity.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    return {
      statements: `vec2 ${ctx.outputs.position} = u_mouse;
vec2 ${ctx.outputs.delta} = u_mouseDelta;`,
    };
  }
}

export default register(Mouse);
