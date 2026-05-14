// LinearGradientDomain — projects `p` onto the segment `start → end` and
// returns the [0,1]-clamped parameter `t`. The companion piece feeds a
// color-ramp to make the legacy linear-gradient.
//
// `start` and `end` live in UV space (the same space the canvas overlay's
// PointVec2 handles operate in), so feed this primitive with `screen-uv.uv`,
// not the centered `texture-coordinate.out`.

import { z } from "zod";
import { zVec2 } from "@/shaders/core/schemas";
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
  start: zVec2(0, 1).default([0, 0.5]),
  end: zVec2(0, 1).default([1, 0.5]),
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

class LinearGradientDomain extends BasePrimitive<Config, In, Out> {
  static readonly typeId = "linear-gradient-domain";
  static readonly meta: PrimitiveMeta = {
    name: "Linear Gradient Domain",
    category: "texture",
    color: "#06b6d4",
    description: "Projects UV onto a start→end segment, returning t ∈ [0, 1].",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    return [
      { nameSuffix: "start", type: "vec2", value: c.start },
      { nameSuffix: "end", type: "vec2", value: c.end },
    ];
  }

  spatialControls(): readonly SpatialControl[] {
    return [
      {
        kind: "segmentVec2",
        from: "start",
        to: "end",
        label: "Gradient line",
      },
    ];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const p = ctx.inputs.p;
    const out = ctx.outputs.out;
    const s = ctx.uniforms.start;
    const e = ctx.uniforms.end;
    const d = `${out}_d`;
    return {
      statements: [
        `vec2 ${d} = ${e} - ${s};`,
        `float ${out} = clamp(dot(${p} - ${s}, ${d}) / max(dot(${d}, ${d}), 1e-6), 0.0, 1.0);`,
      ].join("\n"),
    };
  }
}

export default register(LinearGradientDomain);
