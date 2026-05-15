// PrevFrameSample — sample `u_prevFrame` at an arbitrary UV. Companion to
// `sample-previous-pass`: that one reads the immediately-preceding *pass*
// (within the same frame), while this reads the previous *frame* — used by
// effects that accumulate state over time, e.g. cursor trails. The codegen
// detects `u_prevFrame` in the emitted main and declares the corresponding
// uniform automatically.

import { z } from "zod";
import { color, float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
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

class PrevFrameSample extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "prev-frame-sample";
  static readonly meta: PrimitiveMeta = {
    name: "Prev Frame Sample",
    category: "texture",
    color: "#0ea5e9",
    description: "Sample the previous frame's output (cross-frame state).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const tmp = `${ctx.outputs.color}_sample`;
    return {
      statements: `vec4 ${tmp} = texture(u_prevFrame, ${ctx.inputs.uv});
vec3 ${ctx.outputs.color} = ${tmp}.rgb;
float ${ctx.outputs.alpha} = ${tmp}.a;`,
    };
  }
}

export default register(PrevFrameSample);
