// SDF — signed-distance-function primitive with selectable shape. Outputs the
// signed distance (negative inside, zero on the boundary, positive outside)
// alongside the outward gradient normal derived from a 4-tap finite-difference.
//
//   rounded-box   Axis-aligned rounded rectangle. Uses `center`, `size`
//                 (half-extents), and `radius`.
//   circle        Disc of `radius` centred at `center`. `size` is ignored.
//   box           Axis-aligned sharp-cornered rectangle. Equivalent to
//                 rounded-box with radius=0; `radius` pin is ignored.
//
// Bundling distance + normal in one primitive is intentional: any
// normal-driven refraction or rim effect needs both, and the normal is a
// derivative of the same SDF — wiring four extra evaluations in the graph
// would cost ~30 nodes per use. Same multi-output atomicity rationale as
// `voronoi-texture` exposing distance alongside position from one cellular
// loop. Pin schema is shared across shapes — unused pins are inert, matching
// how `mask`'s `angle` only kicks in for gradient-linear.

import { z } from "zod";
import { float, uv, vec2, vector2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { withMeta } from "@/shaders/core/schemas";

const SHAPES = ["rounded-box", "circle", "box"] as const;
type Shape = (typeof SHAPES)[number];

const SHAPE_LABEL: Record<Shape, string> = {
  "rounded-box": "Rounded Box",
  circle: "Circle",
  box: "Box",
};

const config = z.object({
  shape: withMeta(z.enum(SHAPES), { enumLabels: SHAPE_LABEL }).default("rounded-box"),
});
type Config = z.infer<typeof config>;

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  center: vec2("Center", [0.5, 0.5]),
  // Half-extents for box-family shapes; ignored by `circle`.
  size: vec2("Size", [0.25, 0.25]),
  // Used by `rounded-box` (corner radius) and `circle` (disc radius);
  // ignored by `box`.
  radius: float("Radius", 0.05),
  // Finite-difference step for the normal. Smaller = sharper corners but
  // noisier; larger = smoother but slightly blunted.
  eps: float("Epsilon", 0.005),
});

const pinOut = z.object({
  distance: float("Distance"),
  normal: vector2("Normal"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

// GLSL expression for the SDF at point `p` (already in local, center-relative
// space). Returns a string that evaluates to a float.
function sdfExpr(shape: Shape, p: string, size: string, radius: string): string {
  switch (shape) {
    case "rounded-box":
      return `(length(max(abs(${p}) - ${size} + vec2(${radius}), vec2(0.0))) - ${radius})`;
    case "circle":
      return `(length(${p}) - ${radius})`;
    case "box": {
      // length(max(|p| - size, 0)) — exterior distance only; interior is the
      // negative max of the components to give a proper signed distance.
      return `(length(max(abs(${p}) - ${size}, vec2(0.0))) + min(max(abs(${p}).x - ${size}.x, abs(${p}).y - ${size}.y), 0.0))`;
    }
  }
}

export class Sdf extends BaseNode<Config, In, Out> {
  static readonly typeId = "sdf";
  static readonly meta: NodeMeta = {
    name: "SDF",
    category: "vector",
    color: "#10b981",
    description: "Signed-distance field — rounded-box, circle, or box — with outward normal.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.uv;
    const center = ctx.inputs.center;
    const sz = ctx.inputs.size;
    const r = ctx.inputs.radius;
    const e = ctx.inputs.eps;
    const d = ctx.outputs.distance;
    const n = ctx.outputs.normal;

    // Evaluate the SDF at five offset points so we can derive both the
    // distance (centre tap) and a finite-difference gradient for the normal.
    const at = (name: string) => sdfExpr(c.shape, name, sz, r);
    const lines: string[] = [];
    lines.push(`vec2 ${d}_p = ${p} - ${center};`);
    lines.push(`vec2 ${d}_px = ${d}_p + vec2(${e}, 0.0);`);
    lines.push(`vec2 ${d}_mx = ${d}_p - vec2(${e}, 0.0);`);
    lines.push(`vec2 ${d}_py = ${d}_p + vec2(0.0, ${e});`);
    lines.push(`vec2 ${d}_my = ${d}_p - vec2(0.0, ${e});`);
    lines.push(`float ${d} = ${at(`${d}_p`)};`);
    lines.push(`float ${d}_dpx = ${at(`${d}_px`)};`);
    lines.push(`float ${d}_dmx = ${at(`${d}_mx`)};`);
    lines.push(`float ${d}_dpy = ${at(`${d}_py`)};`);
    lines.push(`float ${d}_dmy = ${at(`${d}_my`)};`);
    lines.push(
      `vec2 ${d}_grad = vec2((${d}_dpx - ${d}_dmx) * 0.5, (${d}_dpy - ${d}_dmy) * 0.5);`,
    );
    lines.push(
      `vec2 ${n} = length(${d}_grad) < 1e-5 ? vec2(0.0) : normalize(${d}_grad);`,
    );

    return { statements: lines.join("\n") };
  }
}

export default register(Sdf);
