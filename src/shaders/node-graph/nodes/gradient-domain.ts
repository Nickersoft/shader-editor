// GradientDomain — UV → t ∈ [0, 1] under one of four spatial schemes,
// selectable via the `mode` config. Mirrors Blender's gradient node:
//
//   linear   project onto a start→end segment
//   radial   distance from a center, divided by a radius
//   conic    angle sweep around a center
//   diamond  L1 (Manhattan) distance from a center, divided by a size
//
// Pair with a color-ramp to recover the legacy fixed-shape gradient nodes.
// Feed UV (`screen-uv.uv`) — the math lives in UV space so the canvas-overlay
// PointVec2 / SegmentVec2 handles operate where the user can see them.
//
// Each mode publishes only the uniforms and spatial controls it actually
// uses, so the property pane and the canvas overlay stay clean.

import { z } from "zod";
import { zFloat, zVec2 } from "@/shaders/core/schemas";
import type { SpatialControl } from "@/shaders/core/spatial";
import { float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
  type UniformSpec,
  type UniformType,
} from "../registry";
import type { GraphNode } from "../types";

const MODES = ["linear", "radial", "conic", "diamond"] as const;
type Mode = (typeof MODES)[number];

const config = z.object({
  mode: z.enum(MODES).default("linear"),
  start: zVec2(0, 1).default([0, 0.5]),
  end: zVec2(0, 1).default([1, 0.5]),
  center: zVec2(0, 1).default([0.5, 0.5]),
  radius: zFloat(0.01, 2).default(0.5),
  rotation: zFloat(-Math.PI, Math.PI).default(0),
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

// Per-mode uniform sets. Declared as a table so adding a mode means adding
// one row here, one row in CONTROLS, and one branch in `emit()` — nothing else.
const UNIFORMS_BY_MODE: Record<Mode, Record<string, UniformType>> = {
  linear: { start: "vec2", end: "vec2" },
  radial: { center: "vec2", radius: "float" },
  conic: { center: "vec2", rotation: "float" },
  diamond: { center: "vec2", size: "float" },
};

const CONTROLS_BY_MODE: Record<Mode, (cfg: Config) => readonly SpatialControl[]> = {
  linear: () => [{ kind: "segmentVec2", from: "start", to: "end", label: "Gradient line" }],
  radial: () => [{ kind: "radiusVec2", center: "center", r: "radius", label: "Radius" }],
  conic: () => [{ kind: "pointVec2", key: "center", label: "Center" }],
  diamond: () => [{ kind: "pointVec2", key: "center", label: "Center" }],
};

const MODE_LABEL: Record<Mode, string> = {
  linear: "Linear",
  radial: "Radial",
  conic: "Conic",
  diamond: "Diamond",
};

export class GradientDomain extends BaseNode<Config, In, Out> {
  static readonly typeId = "gradient-domain";
  static readonly meta: NodeMeta = {
    name: "Gradient Domain",
    category: "texture",
    color: "#06b6d4",
    description: "UV → t ∈ [0, 1] under linear / radial / conic / diamond schemes.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  uniforms(node: GraphNode): readonly UniformSpec[] {
    const c = this.cfg(node.config);
    const keys = UNIFORMS_BY_MODE[c.mode];
    const cfg = node.config as Record<string, unknown>;
    const specs: UniformSpec[] = [];
    for (const key in keys) {
      specs.push({ nameSuffix: key, type: keys[key], value: cfg[key] });
    }
    return specs;
  }

  spatialControls(node: GraphNode): readonly SpatialControl[] {
    const c = this.cfg(node.config);
    return CONTROLS_BY_MODE[c.mode](c);
  }

  displayTitle(cfg: Record<string, unknown>): string {
    return `${MODE_LABEL[this.cfg(cfg).mode]} Gradient`;
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms as Record<string, string>;

    switch (c.mode) {
      case "linear": {
        const d = `${o}_d`;
        return {
          statements: [
            `vec2 ${d} = ${u.end} - ${u.start};`,
            `float ${o} = clamp(dot(${p} - ${u.start}, ${d}) / max(dot(${d}, ${d}), 1e-6), 0.0, 1.0);`,
          ].join("\n"),
        };
      }
      case "radial":
        return {
          statements: `float ${o} = clamp(length(${p} - ${u.center}) / max(${u.radius}, 1e-6), 0.0, 1.0);`,
        };
      case "conic": {
        const d = `${o}_d`;
        return {
          statements: [
            `vec2 ${d} = ${p} - ${u.center};`,
            `float ${o} = fract((atan(${d}.y, ${d}.x) - ${u.rotation}) / 6.2831853 + 0.5);`,
          ].join("\n"),
        };
      }
      case "diamond": {
        const d = `${o}_d`;
        return {
          statements: [
            `vec2 ${d} = abs(${p} - ${u.center});`,
            `float ${o} = clamp((${d}.x + ${d}.y) / max(${u.size}, 1e-6), 0.0, 1.0);`,
          ].join("\n"),
        };
      }
    }
  }
}

export default register(GradientDomain);
