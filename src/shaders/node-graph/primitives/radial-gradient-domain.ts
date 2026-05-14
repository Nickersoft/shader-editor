// RadialGradientDomain — distance-from-center over a configurable radius.
//
// Output is `t = clamp(length(p - center) / radius, 0, 1)`. Feed UV
// (`screen-uv.uv`) for canvas-aligned behaviour; pair with a color-ramp.

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
  radius: zFloat(0.01, 2).default(0.5),
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

class RadialGradientDomain extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "radial-gradient-domain";
  static readonly meta: PrimitiveMeta = {
    name: "Radial Gradient Domain",
    category: "texture",
    color: "#06b6d4",
    description: "Distance from center over radius, returning t ∈ [0, 1].",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "center", type: "vec2", value: c.center },
      { nameSuffix: "radius", type: "float", value: c.radius },
    ];
  }

  spatialControls(): readonly SpatialControl[] {
    return [
      {
        kind: "radiusVec2",
        center: "center",
        r: "radius",
        label: "Radius",
      },
    ];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const out = ctx.outputs.out;
    const center = ctx.uniforms.center;
    const radius = ctx.uniforms.radius;
    return {
      statements: `float ${out} = clamp(length(${p} - ${center}) / max(${radius}, 1e-6), 0.0, 1.0);`,
    };
  }
}

export default register(RadialGradientDomain);
