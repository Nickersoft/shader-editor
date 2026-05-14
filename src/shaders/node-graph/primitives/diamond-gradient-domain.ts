// DiamondGradientDomain — L1 (Manhattan) distance from a center divided by
// `size`. Produces diamond-shaped iso-contours of `t`. Feed UV (`screen-uv.uv`)
// and pair with a color-ramp.

import { z } from "zod";
import { zFloat, zVec2 } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";
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
  center: zVec2(0, 1).default([0.5, 0.5]),
  size: zFloat(0.01, 2).default(0.5),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("UV", [0.5, 0.5]),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class DiamondGradientDomain extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "diamond-gradient-domain";
  static readonly meta: PrimitiveMeta = {
    name: "Diamond Gradient Domain",
    category: "texture",
    color: "#06b6d4",
    description: "L1 distance from center over size, returning t ∈ [0, 1].",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "center", type: "vec2", value: c.center },
      { nameSuffix: "size", type: "float", value: c.size },
    ];
  }

  spatialControls(): readonly SpatialControl[] {
    return [{ kind: "pointVec2", key: "center", label: "Center" }];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const out = ctx.outputs.out;
    const center = ctx.uniforms.center;
    const size = ctx.uniforms.size;
    const d = `${out}_d`;
    return {
      statements: [
        `vec2 ${d} = abs(${p} - ${center});`,
        `float ${out} = clamp((${d}.x + ${d}.y) / max(${size}, 1e-6), 0.0, 1.0);`,
      ].join("\n"),
    };
  }
}

export default register(DiamondGradientDomain);
