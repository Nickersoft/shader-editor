// Normal — generate a surface normal at a UV. Mirrors Blender's Normal node
// in spirit: configurable shape, produces a vec3 normal vector. Pairs with
// distortion / lighting effects that want a parametric surface (e.g.
// spherize).

import { z } from "zod";
import { bool, float, uv, vec2, vector3 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { withMeta } from "@/shaders/core/schemas";

const MODES = ["sphere", "plane"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  sphere: "Sphere",
  plane: "Plane",
};

const config = z.object({
  mode: withMeta(z.enum(MODES), { enumLabels: MODE_LABEL }).default("sphere"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  center: vec2("Center", [0.5, 0.5]),
  radius: float("Radius", 0.5),
});

const pinOut = z.object({
  out: vector3("Normal"),
  inside: bool("Inside"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Normal extends BaseNode<Config, In, Out> {
  static readonly typeId = "normal";
  static readonly meta: NodeMeta = {
    name: "Normal",
    category: "vector",
    color: "#a78bfa",
    description: "Surface normal at a UV — sphere or plane.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const mode = this.cfg(ctx.config).mode;
    const u = ctx.inputs.uv;
    const c = ctx.inputs.center;
    const r = ctx.inputs.radius;
    const o = ctx.outputs.out;
    const ins = ctx.outputs.inside;

    if (mode === "plane") {
      // Flat plane: normal points straight out, never "inside".
      return {
        statements: `vec3 ${o} = vec3(0.0, 0.0, 1.0);
bool ${ins} = true;`,
      };
    }
    // Sphere: derive z from (uv - center) treating radius as the great-
    // circle radius. Points outside the unit disc are flagged !inside.
    return {
      statements: `vec2 ${o}_d = (${u} - ${c}) / max(${r}, 1e-6);
float ${o}_d2 = dot(${o}_d, ${o}_d);
bool ${ins} = ${o}_d2 <= 1.0;
float ${o}_z = sqrt(max(1.0 - ${o}_d2, 0.0));
vec3 ${o} = vec3(${o}_d.x, ${o}_d.y, ${o}_z);`,
    };
  }
}

export default register(Normal);
