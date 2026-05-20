// Projection — collapse a vec3 to vec2 via perspective or orthographic
// projection. Pairs with `mapping` for full 3D → screen pipelines: rotate a
// point in space with `mapping`, then project to UV with `projection`.

import { z } from "zod";
import { float, uv, vector3 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import { withMeta } from "@/shaders/core/schemas";

const MODES = ["perspective", "orthographic"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABEL: Record<Mode, string> = {
  perspective: "Perspective",
  orthographic: "Orthographic",
};

const config = z.object({
  mode: withMeta(z.enum(MODES), { enumLabels: MODE_LABEL }).default("perspective"),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  point: vector3("Point", [0, 0, 1]),
  focal: float("Focal", 1),
});

const pinOut = z.object({
  out: uv("UV"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class Projection extends BaseNode<Config, In, Out> {
  static readonly typeId = "projection";
  static readonly meta: NodeMeta = {
    name: "Projection",
    category: "vector",
    color: "#a78bfa",
    description: "Project a 3D point to 2D via perspective or orthographic projection.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const mode = this.cfg(ctx.config).mode;
    const p = ctx.inputs.point;
    const f = ctx.inputs.focal;
    const o = ctx.outputs.out;
    if (mode === "perspective") {
      // Guard against z == 0 to avoid NaN propagation when the point sits on
      // the camera plane.
      return {
        statements: `vec2 ${o} = vec2(${p}.x, ${p}.y) * (${f} / max(abs(${p}.z), 1e-6));`,
      };
    }
    // Orthographic: drop z, scale x/y by focal (a generic gain knob).
    return { statements: `vec2 ${o} = vec2(${p}.x, ${p}.y) * ${f};` };
  }
}

export default register(Projection);
