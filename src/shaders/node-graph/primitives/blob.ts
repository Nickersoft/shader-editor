// Blob — animated organic blob (composite). Outputs colour and alpha so the
// caller can blend the blob over its background of choice.

import { z } from "zod";
import { zFloat, zVec2, zVec3 } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  center: zVec2().default([0.5, 0.5]),
  colorA: zVec3().default([1.0, 0.42, 0.21]),
  colorB: zVec3().default([0.91, 0.12, 0.39]),
  size: zFloat(0, 1, 0.01).default(0.5),
  deformation: zFloat(0, 1, 0.01).default(0.5),
  softness: zFloat(0, 1, 0.01).default(0.5),
  highlightIntensity: zFloat(0, 1, 0.01).default(0.5),
  highlightX: zFloat(-1, 1, 0.01).default(0.3),
  highlightY: zFloat(-1, 1, 0.01).default(-0.3),
  highlightZ: zFloat(0, 1, 0.01).default(0.4),
  highlightColor: zVec3().default([1.0, 0.88, 0.1]),
  speed: zFloat(0, 4, 0.05).default(0.5),
  seed: zFloat(0, 100, 0.1).default(1),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [];
const OUTPUTS: readonly PinSpec[] = [
  { id: "color", type: "vec3", label: "Color" },
  { id: "alpha", type: "float", label: "Alpha" },
];

export default registerPrimitive({
  typeId: "blob",
  name: "Blob",
  category: "sources",
  color: "#ff6b35",
  description: "Animated organic blob with highlight.",
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
      { nameSuffix: "center", type: "vec2", value: c.center },
      { nameSuffix: "colorA", type: "vec3", value: c.colorA },
      { nameSuffix: "colorB", type: "vec3", value: c.colorB },
      { nameSuffix: "size", type: "float", value: c.size },
      { nameSuffix: "deformation", type: "float", value: c.deformation },
      { nameSuffix: "softness", type: "float", value: c.softness },
      { nameSuffix: "highlightIntensity", type: "float", value: c.highlightIntensity },
      { nameSuffix: "highlightX", type: "float", value: c.highlightX },
      { nameSuffix: "highlightY", type: "float", value: c.highlightY },
      { nameSuffix: "highlightZ", type: "float", value: c.highlightZ },
      { nameSuffix: "highlightColor", type: "vec3", value: c.highlightColor },
      { nameSuffix: "speed", type: "float", value: c.speed },
      { nameSuffix: "seed", type: "float", value: c.seed },
    ] satisfies UniformSpec[];
  },

  emit(ctx) {
    ctx.addDependency("fbm");
    ctx.addDependency("simplex2D");
    const o = ctx.outputs.color;
    const a = ctx.outputs.alpha;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 ${o}_p = (uv - ${u.center}) * ${o}_ar;
float ${o}_t = u_time * ${u.speed};
float ${o}_r0 = ${u.size} * 0.45 + 0.05;
float ${o}_ang = atan(${o}_p.y, ${o}_p.x);
float ${o}_def = ${u.deformation};
float ${o}_warp = 0.0;
${o}_warp += sin(${o}_ang * 3.0 + ${o}_t * 0.7 + ${u.seed}) * 0.18;
${o}_warp += sin(${o}_ang * 5.0 - ${o}_t * 1.1 + ${u.seed} * 1.7) * 0.10;
${o}_warp += fbm(vec2(cos(${o}_ang), sin(${o}_ang)) * 2.0 + ${o}_t * 0.2 + ${u.seed}, 3.0, 2.0, 0.5) * 0.25;
float ${o}_rad = ${o}_r0 * (1.0 + ${o}_warp * ${o}_def);
float ${o}_d = length(${o}_p) - ${o}_rad;
float ${o}_edge = mix(0.005, 0.20, ${u.softness});
float ${a} = 1.0 - smoothstep(-${o}_edge, ${o}_edge, ${o}_d);
float ${o}_fill = clamp(length(${o}_p) / max(${o}_rad, 1e-4), 0.0, 1.0);
vec3 ${o}_bg = mix(${u.colorA}, ${u.colorB}, ${o}_fill);
float ${o}_in = clamp(-${o}_d / max(${o}_rad, 1e-4), 0.0, 1.0);
float ${o}_h = sqrt(max(${o}_in, 0.0));
vec2 ${o}_grad = vec2(dFdx(${o}_d), dFdy(${o}_d));
vec3 ${o}_n = normalize(vec3(-${o}_grad * 4.0, max(${o}_h, 0.001)));
vec3 ${o}_l = normalize(vec3(${u.highlightX}, ${u.highlightY}, max(${u.highlightZ}, 0.05)));
float ${o}_spec = pow(max(dot(${o}_n, ${o}_l), 0.0), 24.0);
vec3 ${o}_hi = ${u.highlightColor} * ${o}_spec * ${u.highlightIntensity} * 1.6;
vec3 ${o} = ${o}_bg + ${o}_hi * ${a};`,
    };
  },
});
