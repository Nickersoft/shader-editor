// GradientTexture — `p`-derived scalar across a set of canned gradient shapes.

import { z } from "zod";
import { float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({
  type: z
    .enum(["linear", "quadratic", "easing", "diagonal", "spherical", "quadratic-sphere", "radial"])
    .default("linear"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class GradientTexture extends BaseNode<Config, In, Out> {
  static readonly typeId = "gradient-texture";
  static readonly meta: NodeMeta = {
    name: "Gradient Texture",
    category: "texture",
    color: "#06b6d4",
    description: "Canned gradient shapes — linear, radial, spherical, …",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    let expr: string;
    switch (c.type) {
      case "quadratic": {
        const t = `clamp(${p}.x, 0.0, 1.0)`;
        expr = `${t} * ${t}`;
        break;
      }
      case "easing":
        expr = `smoothstep(0.0, 1.0, clamp(${p}.x, 0.0, 1.0))`;
        break;
      case "diagonal":
        expr = `clamp((${p}.x + ${p}.y) * 0.5 + 0.5, 0.0, 1.0)`;
        break;
      case "spherical":
        expr = `clamp(1.0 - length(${p}), 0.0, 1.0)`;
        break;
      case "quadratic-sphere": {
        const r = `clamp(1.0 - length(${p}), 0.0, 1.0)`;
        expr = `${r} * ${r}`;
        break;
      }
      case "radial":
        expr = `(atan(${p}.y, ${p}.x) / 6.2831853 + 0.5)`;
        break;
      case "linear":
      default:
        expr = `clamp(${p}.x * 0.5 + 0.5, 0.0, 1.0)`;
        break;
    }
    return { statements: `float ${o} = ${expr};` };
  }
}

export default register(GradientTexture);
