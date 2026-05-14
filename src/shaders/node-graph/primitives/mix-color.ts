// MixColor — `mix(a, b, t)` over vec3 colors. Convenience for the composite
// effects whose `(color, alpha)` outputs need blending onto a background.

import { z } from "zod";
import { color, float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

// `clampT` keeps the historical behaviour (mix's `t` clamped to [0,1]) so
// presets that predate the flag stay safe. Adjustments like saturation and
// vibrance intentionally over-shoot the unit interval and turn clamping off.
const config = z.object({
  clampT: z.boolean().default(true),
});

const pinIn = z.object({
  a: color("A", [0, 0, 0]),
  b: color("B", [1, 1, 1]),
  t: float("Mix", 0),
});

const pinOut = z.object({
  out: color("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

type Config = z.infer<typeof config>;

class MixColor extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "mix-color";
  static readonly meta: PrimitiveMeta = {
    name: "Mix Color",
    category: "color",
    color: "#ec4899",
    description: "Linear blend between two colors.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const t = this.cfg(ctx.config).clampT
      ? `clamp(${ctx.inputs.t}, 0.0, 1.0)`
      : ctx.inputs.t;
    return {
      statements: `vec3 ${ctx.outputs.out} = mix(${ctx.inputs.a}, ${ctx.inputs.b}, ${t});`,
    };
  }
}

export default register(MixColor);
