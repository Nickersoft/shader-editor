// GridLines — antialiased line grid.

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
  lineWidth: zFloat(0, 1, 0.005).default(0.1),
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

class GridLines extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "grid-lines";
  static readonly meta: PrimitiveMeta = {
    name: "Grid Lines",
    category: "texture",
    color: "#94a3b8",
    description: "Antialiased line grid.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "lineWidth", type: "float", value: c.lineWidth },
      { nameSuffix: "softness", type: "float", value: c.softness },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_gp = ${p} * ${u.scale};
vec2 ${o}_gf = abs(fract(${o}_gp) - 0.5);
float ${o}_gm = min(${o}_gf.x, ${o}_gf.y);
float ${o}_gw = clamp(${u.lineWidth}, 0.0, 1.0) * 0.5;
float ${o}_gs = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_gm);
float ${o} = 1.0 - smoothstep(${o}_gw, ${o}_gw + ${o}_gs, ${o}_gm);`,
    };
  }
}

export default register(GridLines);
