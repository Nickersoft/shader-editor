// FloatingParticles — layered drifting particles (composite).

import { z } from "zod";
import { zFloat, zInt, zVec3 } from "@/shaders/core/schemas";
import { color, float } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({
  randomness: zFloat(0, 1, 0.01).default(0.9),
  speed: zFloat(0, 4, 0.05).default(0.3),
  angle: zFloat(-360, 360, 1).default(90),
  rotation: zFloat(-360, 360, 1).default(0),
  particleSize: zFloat(0, 4, 0.01).default(0.6),
  particleSoftness: zFloat(0, 1, 0.01).default(0.85),
  sizeVariance: zFloat(0, 1, 0.01).default(0.7),
  sway: zFloat(0, 1, 0.01).default(0.4),
  twinkle: zFloat(0, 1, 0.01).default(0.6),
  count: zInt(1, 12).default(5),
  particleColor: zVec3().default([1, 1, 1]),
  speedVariance: zFloat(0, 1, 0.01).default(0.5),
  angleVariance: zFloat(0, 180, 1).default(15),
  particleDensity: zFloat(0.5, 12, 0.1).default(2.5),
});

type Config = z.infer<typeof config>;

const pinOut = z.object({
  color: color("Color"),
  alpha: float("Alpha"),
});

type Out = z.infer<typeof pinOut>;

class FloatingParticles extends BasePrimitive<Config, Record<string, never>, Out> {
  static readonly typeId = "floating-particles";
  static readonly meta: PrimitiveMeta = {
    name: "Floating Particles",
    category: "texture",
    color: "#fbbf24",
    description: "Layered drifting particles.",
  };
  static readonly config = config;
  static readonly pins = { in: z.object({}), out: pinOut };
  static readonly uniformKeys = {
    randomness: "float",
    speed: "float",
    angle: "float",
    rotation: "float",
    particleSize: "float",
    particleSoftness: "float",
    sizeVariance: "float",
    sway: "float",
    twinkle: "float",
    count: "int",
    particleColor: "vec3",
    speedVariance: "float",
    angleVariance: "float",
    particleDensity: "float",
  } as const;

  emit(ctx: EmitContext<Record<string, never>, Out>): EmitResult {
    ctx.addDependency("hash21");
    ctx.addDependency("hash22");
    ctx.addDependency("rotate2D");
    const o = ctx.outputs.color;
    const a = ctx.outputs.alpha;
    const u = ctx.uniforms;
    return {
      statements: `vec2 ${o}_ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec3 ${o}_acc = vec3(0.0);
float ${o}_asum = 0.0;
float ${o}_layers = float(${u.count});
float ${o}_ba = radians(${u.angle});
float ${o}_av = radians(${u.angleVariance});
for (int ${o}_i = 0; ${o}_i < 12; ${o}_i++) {
  if (float(${o}_i) >= ${o}_layers) break;
  float ${o}_fi = float(${o}_i);
  float ${o}_lk = ${o}_fi / max(${o}_layers, 1.0);
  float ${o}_lh = hash21(vec2(${o}_fi * 7.13, 1.7));
  float ${o}_ls = mix(1.0 - ${u.speedVariance}, 1.0 + ${u.speedVariance}, ${o}_lh);
  float ${o}_la = ${o}_ba + (${o}_lh - 0.5) * 2.0 * ${o}_av;
  vec2 ${o}_dir = vec2(cos(${o}_la), sin(${o}_la));
  vec2 ${o}_drift = ${o}_dir * u_time * ${u.speed} * 0.06 * ${o}_ls;
  float ${o}_dens = ${u.particleDensity} * (1.0 + 0.4 * ${o}_lk);
  vec2 ${o}_cs = rotate2D((uv - 0.5) * ${o}_ar, radians(${u.rotation})) + 0.5;
  vec2 ${o}_q = ${o}_cs * ${o}_dens - ${o}_drift;
  vec2 ${o}_cid = floor(${o}_q);
  vec2 ${o}_cuv = fract(${o}_q);
  float ${o}_lA = 0.0;
  for (int ${o}_oy = -1; ${o}_oy <= 1; ${o}_oy++) {
    for (int ${o}_ox = -1; ${o}_ox <= 1; ${o}_ox++) {
      vec2 ${o}_off = vec2(float(${o}_ox), float(${o}_oy));
      vec2 ${o}_nid = ${o}_cid + ${o}_off;
      vec2 ${o}_h = hash22(${o}_nid + ${o}_fi * 31.0);
      vec2 ${o}_h2 = hash22(${o}_nid * 0.91 + ${o}_fi * 17.3);
      vec2 ${o}_jt = (${o}_h - 0.5) * ${u.randomness};
      vec2 ${o}_per = vec2(-${o}_dir.y, ${o}_dir.x);
      float ${o}_swp = ${o}_h2.x * 6.2831 + u_time * (0.6 + ${o}_h2.y * 1.2);
      vec2 ${o}_swo = ${o}_per * sin(${o}_swp) * ${u.sway} * 0.35;
      vec2 ${o}_cp = vec2(0.5) + ${o}_jt + ${o}_swo;
      float ${o}_dist = distance(${o}_cuv - ${o}_off, ${o}_cp);
      float ${o}_sm = mix(1.0 - ${u.sizeVariance}, 1.0, ${o}_h2.x);
      float ${o}_pr = mix(0.02, 0.18, clamp(${u.particleSize}, 0.0, 4.0) * 0.25) * ${o}_sm;
      float ${o}_sft = mix(0.0008, ${o}_pr, ${u.particleSoftness});
      float ${o}_dot = 1.0 - smoothstep(${o}_pr - ${o}_sft, ${o}_pr, ${o}_dist);
      float ${o}_tw = 0.5 + 0.5 * sin(u_time * 2.2 * (0.6 + ${o}_h.y) + ${o}_h2.x * 6.2831);
      float ${o}_aval = ${o}_dot * mix(1.0, ${o}_tw, ${u.twinkle});
      ${o}_lA = max(${o}_lA, ${o}_aval);
    }
  }
  ${o}_acc += ${u.particleColor} * ${o}_lA;
  ${o}_asum = max(${o}_asum, ${o}_lA);
}
vec3 ${o} = ${o}_acc;
float ${a} = clamp(${o}_asum, 0.0, 1.0);`,
    };
  }
}

export default register(FloatingParticles);
