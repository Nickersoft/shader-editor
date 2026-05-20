// HSV → RGB converter. Companion to rgb-to-hsv; together they let hue-shift,
// saturation, and value adjustments be expressed as a round-trip through HSV
// space with primitive math in the middle.

import { z } from "zod";
import { color, vec3 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  hsv: vec3("HSV", [0, 0, 0]),
});

const pinOut = z.object({
  rgb: color("RGB"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class HsvToRgb extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "hsv-to-rgb";
  static readonly meta: NodeMeta = {
    name: "HSV → RGB",
    category: "color",
    color: "#f59e0b",
    description: "Convert HSV back to linear RGB.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("hsv2rgb");
    return {
      statements: `vec3 ${ctx.outputs.rgb} = hsv2rgb(${ctx.inputs.hsv});`,
    };
  }
}

export default register(HsvToRgb);
