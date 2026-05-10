import { z } from "zod";
import { GeneratorNode } from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { GlslBlock, NodeMeta } from "@/shaders/core/types";
import { zAngle, zColor, zFloat, zInt } from "@/shaders/core/schemas";

const config = z.object({
  randomness: zFloat(0, 1).default(0.9).describe("Randomness"),
  speed: zFloat(0, 4, 0.05).default(0.3).describe("Speed"),
  angle: zAngle(1).default(90).describe("Angle"),
  rotation: zAngle(1).default(0).describe("Rotation"),
  particleSize: zFloat(0, 4, 0.01).default(0.6).describe("Particle Size"),
  particleSoftness: zFloat(0, 1).default(0.85).describe("Particle Softness"),
  sizeVariance: zFloat(0, 1).default(0.7).describe("Size Variance"),
  sway: zFloat(0, 1).default(0.4).describe("Sway"),
  twinkle: zFloat(0, 1).default(0.6).describe("Twinkle"),
  count: zInt(1, 12).default(5).describe("Layer Count"),
  particleColor: zColor().default([1, 1, 1]).describe("Particle Color"),
  speedVariance: zFloat(0, 1).default(0.5).describe("Speed Variance"),
  angleVariance: zFloat(0, 180, 1).default(15).describe("Angle Variance"),
  particleDensity: zFloat(0.5, 12, 0.1).default(2.5).describe("Particle Density"),
});

const inputs = z.object({});

const meta: NodeMeta = {
  name: "Floating Particles",
  description: "Animated floating particles with twinkle effects",
  color: "#fbbf24",
  category: "textures",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FloatingParticles extends GeneratorNode<Config, Inputs> {
  static readonly typeId = "floating-particles";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;

  glsl(): GlslBlock {
    const randomness = this.uniformName("randomness");
    const speed = this.uniformName("speed");
    const angle = this.uniformName("angle");
    const rotation = this.uniformName("rotation");
    const particleSize = this.uniformName("particleSize");
    const particleSoftness = this.uniformName("particleSoftness");
    const sizeVariance = this.uniformName("sizeVariance");
    const sway = this.uniformName("sway");
    const twinkle = this.uniformName("twinkle");
    const count = this.uniformName("count");
    const particleColor = this.uniformName("particleColor");
    const speedVariance = this.uniformName("speedVariance");
    const angleVariance = this.uniformName("angleVariance");
    const particleDensity = this.uniformName("particleDensity");
    return {
      dependencies: ["hash21", "hash22", "rotate2D"],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec3 accum = vec3(0.0);
float alphaSum = 0.0;
float layers = float(${count});
float baseAng = radians(${angle});
float angVar = radians(${angleVariance});
for (int i = 0; i < 12; i++) {
  if (float(i) >= layers) break;
  float fi = float(i);
  float layerKey = fi / max(layers, 1.0);
  float layerHash = hash21(vec2(fi * 7.13, 1.7));

  float layerSpeed = mix(1.0 - ${speedVariance}, 1.0 + ${speedVariance}, layerHash);
  float layerAng = baseAng + (layerHash - 0.5) * 2.0 * angVar;
  vec2 dir = vec2(cos(layerAng), sin(layerAng));
  vec2 drift = dir * u_time * ${speed} * 0.06 * layerSpeed;

  float dens = ${particleDensity} * (1.0 + 0.4 * layerKey);
  vec2 cellSpace = rotate2D((uv - 0.5) * _ar, radians(${rotation})) + 0.5;
  vec2 q = cellSpace * dens - drift;
  vec2 cellId = floor(q);
  vec2 cellUv = fract(q);

  // Sample a 3x3 neighborhood so particles can drift beyond cell bounds
  // and break up the visible grid pattern.
  float layerAlpha = 0.0;
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 off = vec2(float(ox), float(oy));
      vec2 nId = cellId + off;
      vec2 h = hash22(nId + fi * 31.0);
      vec2 h2 = hash22(nId * 0.91 + fi * 17.3);

      // Per-particle jitter inside its home cell.
      vec2 jitter = (h - 0.5) * ${randomness};
      // Per-particle horizontal sway (perpendicular to drift direction).
      vec2 perp = vec2(-dir.y, dir.x);
      float swayPhase = h2.x * 6.2831 + u_time * (0.6 + h2.y * 1.2);
      vec2 swayOff = perp * sin(swayPhase) * ${sway} * 0.35;

      vec2 cp = vec2(0.5) + jitter + swayOff;
      float d = distance(cellUv - off, cp);

      // Per-particle size variation — dust comes in many sizes.
      float sizeMul = mix(1.0 - ${sizeVariance}, 1.0, h2.x);
      float pr = mix(0.02, 0.18, clamp(${particleSize}, 0.0, 4.0) * 0.25) * sizeMul;
      float soft = mix(0.0008, pr, ${particleSoftness});
      float dot_ = 1.0 - smoothstep(pr - soft, pr, d);

      float tw = 0.5 + 0.5 * sin(u_time * 2.2 * (0.6 + h.y) + h2.x * 6.2831);
      float a = dot_ * mix(1.0, tw, ${twinkle});

      layerAlpha = max(layerAlpha, a);
    }
  }

  accum += ${particleColor} * layerAlpha;
  alphaSum = max(alphaSum, layerAlpha);
}
float aOut = clamp(alphaSum, 0.0, 1.0);
return vec4(accum, aOut);`,
    };
  }
}

register(FloatingParticles);
export default FloatingParticles;
