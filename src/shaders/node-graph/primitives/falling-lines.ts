// FallingLines — directional falling streaks (composite, outputs color + alpha).

import { z } from "zod";
import { zFloat, zVec3 } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  colorA: zVec3().default([1, 1, 1]),
  colorB: zVec3().default([1, 1, 1]),
  angle: zFloat(-360, 360, 1).default(90),
  speed: zFloat(0, 4, 0.05).default(0.5),
  speedVariance: zFloat(0, 1, 0.01).default(0.3),
  density: zFloat(2, 100, 1).default(15),
  trailLength: zFloat(0, 1, 0.01).default(0.35),
  balance: zFloat(0, 1, 0.01).default(0.5),
  strokeWidth: zFloat(0, 1, 0.01).default(0.15),
  rounding: zFloat(0, 1, 0.01).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [];
const OUTPUTS: readonly PinSpec[] = [
  { id: "color", type: "vec3", label: "Color" },
  { id: "alpha", type: "float", label: "Alpha" },
];

export default registerPrimitive({
  typeId: "falling-lines",
  name: "Falling Lines",
  category: "sources",
  color: "#0ea5e9",
  description: "Directional falling streaks.",
  config,

  inputs() {
    return INPUTS;
  },
  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [
      { nameSuffix: "colorA", type: "vec3", value: c.colorA },
      { nameSuffix: "colorB", type: "vec3", value: c.colorB },
      { nameSuffix: "angle", type: "float", value: c.angle },
      { nameSuffix: "speed", type: "float", value: c.speed },
      { nameSuffix: "speedVariance", type: "float", value: c.speedVariance },
      { nameSuffix: "density", type: "float", value: c.density },
      { nameSuffix: "trailLength", type: "float", value: c.trailLength },
      { nameSuffix: "balance", type: "float", value: c.balance },
      { nameSuffix: "strokeWidth", type: "float", value: c.strokeWidth },
      { nameSuffix: "rounding", type: "float", value: c.rounding },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("hash21");
    ctx.addDependency("rotate2D");
    const o = ctx.outputs.color;
    const a = ctx.outputs.alpha;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 ${o}_p = (uv - 0.5) * ${o}_ar;
${o}_p = rotate2D(${o}_p, -(${u.angle} - 90.0) * 3.14159265 / 180.0);
float ${o}_dens = ${u.density};
float ${o}_col = floor(${o}_p.x * ${o}_dens);
float ${o}_jit = hash21(vec2(${o}_col, 7.0));
float ${o}_js = mix(1.0 - ${u.speedVariance}, 1.0 + ${u.speedVariance}, ${o}_jit);
float ${o}_yo = u_time * ${u.speed} * 0.6 * ${o}_js + ${o}_jit * 9.7;
float ${o}_sp = max(${u.trailLength} * 1.6, 0.05);
float ${o}_lane = fract(${o}_p.y + ${o}_yo) / ${o}_sp;
float ${o}_along = clamp(${o}_lane, 0.0, 1.0);
float ${o}_on = step(${o}_lane, 1.0);
float ${o}_xl = (fract(${o}_p.x * ${o}_dens) - 0.5) * 2.0;
float ${o}_hw = clamp(${u.strokeWidth}, 0.001, 1.0);
float ${o}_str = 1.0 - smoothstep(${o}_hw * 0.95, ${o}_hw, abs(${o}_xl));
float ${o}_cap = 1.0 - smoothstep(0.95, 1.0, ${o}_along);
float ${o}_rcap = mix(1.0, ${o}_cap, ${u.rounding});
float ${a} = ${o}_str * ${o}_on * ${o}_rcap;
float ${o}_t = clamp(${o}_along + (${u.balance} - 0.5), 0.0, 1.0);
vec3 ${o} = mix(${u.colorA}, ${u.colorB}, ${o}_t);`,
    };
  },
});
