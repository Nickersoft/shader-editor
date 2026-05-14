// HexGrid — antialiased hexagonal lattice.

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
  lineWidth: zFloat(0, 4, 0.01).default(0.1),
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

class HexGrid extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "hex-grid";
  static readonly meta: PrimitiveMeta = {
    name: "Hex Grid",
    category: "texture",
    color: "#94a3b8",
    description: "Antialiased hexagonal lattice.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "lineWidth", type: "float", value: c.lineWidth },
    ] satisfies UniformSpec[];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    ctx.addDependency("aastep");
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_hq = ${p} * ${u.scale};
vec2 ${o}_hh = vec2(1.0, 1.7320508);
vec2 ${o}_ha = mod(${o}_hq, ${o}_hh) - ${o}_hh * 0.5;
vec2 ${o}_hb = mod(${o}_hq - ${o}_hh * 0.5, ${o}_hh) - ${o}_hh * 0.5;
vec2 ${o}_hg = (dot(${o}_ha, ${o}_ha) < dot(${o}_hb, ${o}_hb)) ? ${o}_ha : ${o}_hb;
${o}_hg = abs(${o}_hg);
float ${o}_hd = max(${o}_hg.x, ${o}_hg.x * 0.5 + ${o}_hg.y * 0.866025);
float ${o}_hw = clamp(${u.lineWidth}, 0.0, 4.0) * 0.025;
float ${o} = aastep(0.5 - ${o}_hw, ${o}_hd);`,
    };
  }
}

export default register(HexGrid);
