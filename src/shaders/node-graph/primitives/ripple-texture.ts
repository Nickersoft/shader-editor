// RippleWave — animated concentric ripple.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({
  frequency: zFloat(1, 200, 1).default(20),
  speed: zFloat(0, 4, 0.05).default(1),
  phase: zFloat(0, 6.2832, 0.01).default(0),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
  t: float("Time", 0),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class RippleWave extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "ripple-texture";
  static readonly meta: PrimitiveMeta = {
    name: "Ripple Texture",
    category: "texture",
    color: "#22d3ee",
    description: "Animated concentric ripple.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = {
    frequency: "float",
    speed: "float",
    phase: "float",
  } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `float ${o}_r = length(${p});
float ${o}_w = ${o}_r * ${u.frequency} - ${t} * ${u.speed} * 4.0 + ${u.phase};
float ${o} = 0.5 + 0.5 * cos(${o}_w);`,
    };
  }
}

export default register(RippleWave);
