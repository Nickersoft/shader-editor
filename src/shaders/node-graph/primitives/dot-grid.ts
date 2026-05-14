// DotGrid — antialiased dot lattice.

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
  scale: zFloat(0.1, 200, 0.1).default(8),
  radius: zFloat(0, 1, 0.005).default(0.3),
  softness: zFloat(0, 1, 0.005).default(0.05),
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

class DotGrid extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "dot-grid";
  static readonly meta: PrimitiveMeta = {
    name: "Dot Grid",
    category: "texture",
    color: "#94a3b8",
    description: "Antialiased dot lattice.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "radius", type: "float", value: c.radius },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_dp = ${p} * ${u.scale};
vec2 ${o}_dc = fract(${o}_dp) - 0.5;
float ${o}_dd = length(${o}_dc);
float ${o}_dr = clamp(${u.radius}, 0.0, 1.0) * 0.5;
float ${o}_ds = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_dd);
float ${o} = 1.0 - smoothstep(${o}_dr, ${o}_dr + ${o}_ds, ${o}_dd);`,
    };
  }
}

export default register(DotGrid);
