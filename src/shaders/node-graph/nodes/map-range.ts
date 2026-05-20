// MapRange — remap a scalar from [from_min, from_max] to [to_min, to_max].
//
// The four bounds are uniforms so they edit live. `interp` selects the curve
// applied to the normalized parameter before remapping into the output range:
//
//   linear       → no curve, identity
//   smoothstep   → smoothstep(0, 1, x)
//   smootherstep → 6x⁵ − 15x⁴ + 10x³ (zero 1st- and 2nd-derivative endpoints)
//
// `clamp` (default true) constrains the *input* parameter to [0, 1] before the
// curve is applied — leave it on for safe colour ramping; turn it off when you
// want extrapolation past the input range.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({
  fromMin: zFloat(-1000, 1000).default(0),
  fromMax: zFloat(-1000, 1000).default(1),
  toMin: zFloat(-1000, 1000).default(0),
  toMax: zFloat(-1000, 1000).default(1),
  interp: z.enum(["linear", "smoothstep", "smootherstep"]).default("linear"),
  clamp: z.boolean().default(true),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  x: float("X", 0),
});

const pinOut = z.object({
  out: float("Out"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class MapRange extends BaseNode<Config, In, Out> {
  static readonly typeId = "map-range";
  static readonly meta: NodeMeta = {
    name: "Map Range",
    category: "converter",
    color: "#a78bfa",
    description: "Remap a scalar across two ranges with optional curve.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = {
    fromMin: "float",
    fromMax: "float",
    toMin: "float",
    toMax: "float",
  } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const c = this.cfg(ctx.config);
    const x = ctx.inputs.x;
    const fm = ctx.uniforms.fromMin;
    const fM = ctx.uniforms.fromMax;
    const tm = ctx.uniforms.toMin;
    const tM = ctx.uniforms.toMax;
    const o = ctx.outputs.out;

    // Guard the divide. The downstream curve sees a clamped or raw normalized
    // parameter depending on `clamp`.
    const tRaw = `((${x} - ${fm}) / max(${fM} - ${fm}, 1e-6))`;
    const tNorm = c.clamp ? `clamp(${tRaw}, 0.0, 1.0)` : tRaw;
    if (c.interp === "smootherstep") {
      // Unique local prefixed with `o` so multiple MapRange nodes don't clash.
      const tLocal = `${o}_t`;
      return {
        statements: `float ${tLocal} = ${tNorm};
float ${o} = mix(${tm}, ${tM}, ${tLocal}*${tLocal}*${tLocal}*(${tLocal}*(${tLocal}*6.0-15.0)+10.0));`,
      };
    }
    const tCurved =
      c.interp === "smoothstep" ? `smoothstep(0.0, 1.0, ${tNorm})` : tNorm;
    return {
      statements: `float ${o} = mix(${tm}, ${tM}, ${tCurved});`,
    };
  }
}

export default register(MapRange);
