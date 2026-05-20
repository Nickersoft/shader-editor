// MixColor — `mix(a, b, t)` over vec3 colors. The `space` input pin selects
// the interpolation space at runtime (0=linear, 1=oklch, 2=oklab, 3=hsl,
// 4=hsv, 5=lch); hue-bearing spaces (hsl/hsv/lch/oklch) take the short way
// around the wheel. The dispatcher branch is uniform-uniform per draw call
// since `space` is a uniform — no per-fragment penalty. Pin shape stays
// identical across spaces (Rule 3-friendly), but the selection is exposed
// as a pin rather than a config so presets can drive it from GroupInput.

import { z } from "zod";
import { color, float, int } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
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
  space: int("Color Space", 0),
});

const pinOut = z.object({
  out: color("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

type Config = z.infer<typeof config>;

export class MixColor extends BaseNode<Config, In, Out> {
  static readonly typeId = "mix-color";
  static readonly meta: NodeMeta = {
    name: "Mix Color",
    category: "color",
    color: "#ec4899",
    description: "Linear blend between two colors with optional color-space selection.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("cielabTransforms");
    const t = this.cfg(ctx.config).clampT
      ? `clamp(${ctx.inputs.t}, 0.0, 1.0)`
      : ctx.inputs.t;
    return {
      statements: `vec3 ${ctx.outputs.out} = mixInColorSpace(${ctx.inputs.a}, ${ctx.inputs.b}, ${t}, ${ctx.inputs.space});`,
    };
  }
}

export default register(MixColor);
