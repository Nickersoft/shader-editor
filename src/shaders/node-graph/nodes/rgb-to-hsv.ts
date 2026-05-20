// RGB → HSV converter. Wraps the rgb2hsv helper as a graph primitive so
// hue/saturation/value adjustments can be expressed as a converter + math
// composition rather than bespoke GLSL.

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
  rgb: color("RGB", [0, 0, 0]),
});

const pinOut = z.object({
  hsv: vec3("HSV"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class RgbToHsv extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "rgb-to-hsv";
  static readonly meta: NodeMeta = {
    name: "RGB → HSV",
    category: "color",
    color: "#f59e0b",
    description: "Convert linear RGB to HSV (hue/saturation/value).",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("rgb2hsv");
    return {
      statements: `vec3 ${ctx.outputs.hsv} = rgb2hsv(${ctx.inputs.rgb});`,
    };
  }
}

export default register(RgbToHsv);
