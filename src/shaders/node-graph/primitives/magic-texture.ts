// PlasmaSample — classic 4-sine plasma. Direct port of the legacy field stage.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
  type UniformSpec,
} from "../registry";
import type { GraphNode } from "../types";

const config = z.object({
  intensity: zFloat(0, 4, 0.05).default(1),
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

class PlasmaSample extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "magic-texture";
  static readonly meta: PrimitiveMeta = {
    name: "Magic Texture",
    category: "texture",
    color: "#22d3ee",
    description: "Classic 4-sine plasma field.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [{ nameSuffix: "intensity", type: "float", value: c.intensity } satisfies UniformSpec];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const t = ctx.inputs.t;
    const o = ctx.outputs.out;
    return {
      statements: `float ${o}_v = sin(${p}.x + ${t})
  + sin(${p}.y * 0.7 + ${t} * 1.3)
  + sin((${p}.x + ${p}.y) * 0.6 + ${t} * 0.9)
  + sin(length(${p}) - ${t});
${o}_v *= 0.25 * ${ctx.uniforms.intensity};
float ${o} = clamp(0.5 + 0.5 * ${o}_v, 0.0, 1.0);`,
    };
  }
}

export default register(PlasmaSample);
