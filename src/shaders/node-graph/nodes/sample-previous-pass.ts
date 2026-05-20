// SamplePreviousPass — sample u_prevPass at an arbitrary UV with edge handling.
// The gateway primitive for effect graphs: adjustments sample at the current
// texCoord and do color math; distortions warp the UV first and then sample.
// Output is unpremultiplied so downstream color math sees plain RGB.

import { z } from "zod";
import { edgeMode, zEdges } from "@/shaders/core/schemas";
import { color, float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({
  edges: zEdges().default("stretch").describe("Edges"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  uv: vec2("UV", [0.5, 0.5]),
});

const pinOut = z.object({
  color: color("Color"),
  alpha: float("Alpha"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class SamplePreviousPass extends BaseNode<Config, In, Out> {
  static readonly typeId = "sample-previous-pass";
  static readonly meta: NodeMeta = {
    name: "Sample Previous Pass",
    category: "texture",
    color: "#0ea5e9",
    description:
      "Sample the previous render pass at a UV. Unpremultiplied; edge mode chosen via config.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("applyEdgeHandling");
    ctx.addDependency("unpremultiplyAlpha");
    const cfg = this.cfg(ctx.config);
    const tmp = `${ctx.outputs.color}_sample`;
    return {
      statements: `vec4 ${tmp} = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, ${ctx.inputs.uv}, ${edgeMode(cfg.edges)}));
vec3 ${ctx.outputs.color} = ${tmp}.rgb;
float ${ctx.outputs.alpha} = ${tmp}.a;`,
    };
  }
}

export default register(SamplePreviousPass);
