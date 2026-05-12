// WaveTexture — 1D wave shaped along `p.x` (linear/saw/triangle) or `length(p)`
// (rings). Direct port of the legacy `wave-texture` field stage.

import { z } from "zod";
import { zFloat, zInt } from "@/shaders/core/schemas";
import type { GlslHelperName } from "@/shaders/core/types";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  type: z.enum(["bands", "rings"]).default("bands"),
  profile: z.enum(["sine", "saw", "triangle"]).default("sine"),
  scale: zFloat(0.1, 200, 0.1).default(1),
  phaseOffset: zFloat(-100, 100, 0.01).default(0),
  distortion: zFloat(0, 4, 0.01).default(0),
  detail: zInt(1, 8).default(3),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [{ id: "out", type: "float", label: "Out" }];

export default registerPrimitive({
  typeId: "wave-texture",
  name: "Wave Texture",
  category: "sources",
  color: "#06b6d4",
  description: "Linear or ring wave (sine/saw/triangle).",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    const u: UniformSpec[] = [
      { nameSuffix: "scale", type: "float", value: c.scale },
      { nameSuffix: "phaseOffset", type: "float", value: c.phaseOffset },
    ];
    if (c.distortion !== 0) u.push({ nameSuffix: "distortion", type: "float", value: c.distortion });
    return u;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const p = ctx.inputs.p;
    const o = ctx.outputs.out;
    const phaseExpr = c.type === "rings" ? `length(${o}_wp)` : `${o}_wp.x`;
    const shape =
      c.profile === "saw"
        ? `fract(${o}_phase)`
        : c.profile === "triangle"
          ? `abs(2.0 * fract(${o}_phase) - 1.0)`
          : `0.5 + 0.5 * sin(${o}_phase * 6.2831853)`;
    const warp =
      c.distortion === 0
        ? ""
        : `\n${o}_phase += ${ctx.uniforms.distortion} * fbm(${o}_wp, ${c.detail}.0 + 1.0, 2.0, 0.5);`;
    const deps: GlslHelperName[] = [];
    if (c.distortion !== 0) {
      ctx.addDependency("fbm");
      ctx.addDependency("simplex2D");
    }
    void deps;
    return {
      statements: `vec2 ${o}_wp = ${p} * ${ctx.uniforms.scale};
float ${o}_phase = ${phaseExpr} + ${ctx.uniforms.phaseOffset};${warp}
float ${o} = clamp(${shape}, 0.0, 1.0);`,
    };
  },
});
