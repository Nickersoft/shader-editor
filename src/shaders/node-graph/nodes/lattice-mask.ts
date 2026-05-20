// LatticeMask — antialiased 0/1 mask under one of four lattice schemes,
// selected via the `mode` config:
//
//   checker   alternating 0/1 grid cells (no softness)
//   dots      circular dot lattice
//   lines     orthogonal grid lines
//   hex       hexagonal lattice lines
//
// Each mode publishes only the uniforms it actually uses. Pair with a
// color-ramp (or feed directly into a math/mix node) to colour the result.
// Pass `p` through a `scale` multiply first if you want non-integer cell
// counts; the scale uniform inside this primitive is applied on top.
//
// The separate `cell-grid` primitive stays — it returns a per-cell-local UV
// and a stable cell id, so it serves a different role (cell partitioning,
// not masking).

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
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

const MODES = ["checker", "dots", "lines", "hex"] as const;
type Mode = (typeof MODES)[number];

const config = z.object({
  mode: z.enum(MODES).default("checker"),
  scale: zFloat(0.1, 200, 0.1).default(8),
  radius: zFloat(0, 1, 0.005).default(0.3),
  softness: zFloat(0, 1, 0.005).default(0.05),
  lineWidth: zFloat(0, 4, 0.005).default(0.1),
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

// Per-mode uniform sets — adding a mode means adding one row here and one
// branch in `emit()`. The shared `scale` lives on every mode.
const UNIFORMS_BY_MODE: Record<Mode, Record<string, UniformType>> = {
  checker: { scale: "float" },
  dots: { scale: "float", radius: "float", softness: "float" },
  lines: { scale: "float", lineWidth: "float", softness: "float" },
  hex: { scale: "float", lineWidth: "float" },
};

const MODE_LABEL: Record<Mode, string> = {
  checker: "Checker",
  dots: "Dot Grid",
  lines: "Grid Lines",
  hex: "Hex Grid",
};

export class LatticeMask extends BaseNode<Config, In, Out> {
  static readonly typeId = "lattice-mask";
  static readonly meta: NodeMeta = {
    name: "Lattice Mask",
    category: "texture",
    color: "#94a3b8",
    description: "Antialiased lattice mask — checker / dots / lines / hex.",
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

  displayTitle(cfg: Record<string, unknown>): string {
    return MODE_LABEL[this.cfg(cfg).mode];
  }

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const u = ctx.uniforms as Record<string, string>;

    switch (c.mode) {
      case "checker":
        return {
          statements: `vec2 ${o}_cp = ${p} * ${u.scale};
float ${o} = mod(floor(${o}_cp.x) + floor(${o}_cp.y), 2.0);`,
        };
      case "dots":
        return {
          statements: `vec2 ${o}_dp = ${p} * ${u.scale};
vec2 ${o}_dc = fract(${o}_dp) - 0.5;
float ${o}_dd = length(${o}_dc);
float ${o}_dr = clamp(${u.radius}, 0.0, 1.0) * 0.5;
float ${o}_ds = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_dd);
float ${o} = 1.0 - smoothstep(${o}_dr, ${o}_dr + ${o}_ds, ${o}_dd);`,
        };
      case "lines":
        return {
          statements: `vec2 ${o}_gp = ${p} * ${u.scale};
vec2 ${o}_gf = abs(fract(${o}_gp) - 0.5);
float ${o}_gm = min(${o}_gf.x, ${o}_gf.y);
float ${o}_gw = clamp(${u.lineWidth}, 0.0, 1.0) * 0.5;
float ${o}_gs = clamp(${u.softness}, 0.0, 1.0) * 0.5 + fwidth(${o}_gm);
float ${o} = 1.0 - smoothstep(${o}_gw, ${o}_gw + ${o}_gs, ${o}_gm);`,
        };
      case "hex":
        ctx.addDependency("aastep");
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
}

export default register(LatticeMask);
