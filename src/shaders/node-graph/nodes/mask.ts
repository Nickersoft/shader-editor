// Mask — config-driven shape mask. Outputs a float in [0, 1] describing how
// "inside" the shape a UV is, with smoothness controlling the falloff at
// the edge. Each shape has its own geometry; common knobs are `center`,
// `radius`, and `softness`.

import { z } from "zod";
import { float, uv, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { withMeta } from "@/shaders/core/schemas";

const SHAPES = [
  "vignette",
  "circle",
  "rect",
  "gradient-linear",
  "gradient-radial",
] as const;
type Shape = (typeof SHAPES)[number];

const SHAPE_LABEL: Record<Shape, string> = {
  vignette: "Vignette",
  circle: "Circle",
  rect: "Rectangle",
  "gradient-linear": "Linear Gradient",
  "gradient-radial": "Radial Gradient",
};

const config = z.object({
  shape: withMeta(z.enum(SHAPES), { enumLabels: SHAPE_LABEL }).default("vignette"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  center: vec2("Center", [0.5, 0.5]),
  // Size knob — half-extent for circle / rect, distance for vignette, slope
  // length for gradient-linear.
  radius: float("Radius", 0.4),
  // Edge softness in UV units (0 = hard edge, 1 = very soft).
  softness: float("Softness", 0.1),
  // Direction angle in radians for the linear gradient.
  angle: float("Angle", 0),
});

const pinOut = z.object({
  out: float("Mask"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Mask extends BaseNode<Config, In, Out> {
  static readonly typeId = "mask";
  static readonly meta: NodeMeta = {
    name: "Mask",
    category: "vector",
    color: "#10b981",
    description: "Shape mask — vignette, circle, rect, or linear/radial gradient.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const shape = this.cfg(ctx.config).shape;
    const u = ctx.inputs.uv;
    const c = ctx.inputs.center;
    const r = ctx.inputs.radius;
    const s = ctx.inputs.softness;
    const a = ctx.inputs.angle;
    const o = ctx.outputs.out;

    switch (shape) {
      case "circle":
        // 1 inside the disc, smoothing out across `softness`.
        return {
          statements: `float ${o}_d = length(${u} - ${c});
float ${o} = 1.0 - smoothstep(${r}, ${r} + max(${s}, 1e-4), ${o}_d);`,
        };
      case "vignette":
        // Inverse: 1 at centre, fading out. The radius marks the half-falloff.
        return {
          statements: `float ${o}_d = length(${u} - ${c});
float ${o} = smoothstep(${r} + max(${s}, 1e-4), ${r}, ${o}_d);`,
        };
      case "rect": {
        // Axis-aligned box centred at `center` with half-extent `radius`.
        return {
          statements: `vec2 ${o}_q = abs(${u} - ${c}) - vec2(${r});
float ${o}_d = max(${o}_q.x, ${o}_q.y);
float ${o} = 1.0 - smoothstep(0.0, max(${s}, 1e-4), ${o}_d);`,
        };
      }
      case "gradient-linear": {
        // Project (uv − center) onto the angle direction, then ramp across
        // `radius` with a softness-controlled smoothstep.
        return {
          statements: `vec2 ${o}_dir = vec2(cos(${a}), sin(${a}));
float ${o}_t = dot(${u} - ${c}, ${o}_dir);
float ${o} = smoothstep(-${r}, ${r}, ${o}_t);`,
        };
      }
      case "gradient-radial": {
        // Radial 0→1 ramp from centre to centre+radius.
        return {
          statements: `float ${o}_d = length(${u} - ${c});
float ${o} = smoothstep(0.0, max(${r}, 1e-4), ${o}_d);`,
        };
      }
    }
  }
}

export default register(Mask);
