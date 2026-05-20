// Grain — animated film-grain noise. A high-frequency hash modulated by
// time, scaled by `intensity`. Output is float in [-intensity, +intensity]
// so it composes naturally with `mix-color` or a direct add to RGB.

import { z } from "zod";
import { float, uv } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  time: float("Time", 0),
  intensity: float("Intensity", 0.1),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Grain extends BaseNode<Record<string, never>, In, Out> {
  static readonly typeId = "grain";
  static readonly meta: NodeMeta = {
    name: "Grain",
    category: "texture",
    color: "#f97316",
    description: "Animated film-grain noise, output in [-intensity, +intensity].",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("hash21");
    const u = ctx.inputs.uv;
    const t = ctx.inputs.time;
    const a = ctx.inputs.intensity;
    const o = ctx.outputs.out;
    // hash21 returns [0, 1]; remap to [-1, 1] then scale by intensity. The
    // time offset is added inside the hash so consecutive frames decorrelate.
    return {
      statements: `float ${o} = (hash21(${u} + vec2(${t} * 13.7, ${t} * 41.3)) * 2.0 - 1.0) * ${a};`,
    };
  }
}

export default register(Grain);
