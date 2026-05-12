import { z } from "zod";
import {
  CompositeStageNode,
  type FieldStageContext,
  type FieldStageGlsl,
  type FieldStageUniformTypes,
} from "@/shaders/core/node.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
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
  description: "Layered drifting particles — composite stage with twinkle",
  color: "#fbbf24",
  category: "field-stages",
  defaultBlendMode: "normal",
};

type Config = z.infer<typeof config>;
type Inputs = z.infer<typeof inputs>;

export class FloatingParticles extends CompositeStageNode<Config, Inputs> {
  static readonly typeId = "floating-particles";
  static readonly config = config;
  static readonly inputs = inputs;
  static readonly meta = meta;
  static readonly uniformTypes: FieldStageUniformTypes<Config> = {
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
  };

  glsl({ uniforms }: FieldStageContext<Config>): FieldStageGlsl {
    return {
      dependencies: ["hash21", "hash22", "rotate2D"],
      main: `
vec2 _fpAr = vec2(u_resolution.x / u_resolution.y, 1.0);
vec3 _fpAccum = vec3(0.0);
float _fpAlphaSum = 0.0;
float _fpLayers = float(${uniforms.count});
float _fpBaseAng = radians(${uniforms.angle});
float _fpAngVar = radians(${uniforms.angleVariance});
for (int _fpI = 0; _fpI < 12; _fpI++) {
  if (float(_fpI) >= _fpLayers) break;
  float _fpFi = float(_fpI);
  float _fpLk = _fpFi / max(_fpLayers, 1.0);
  float _fpLh = hash21(vec2(_fpFi * 7.13, 1.7));
  float _fpLs = mix(1.0 - ${uniforms.speedVariance}, 1.0 + ${uniforms.speedVariance}, _fpLh);
  float _fpLa = _fpBaseAng + (_fpLh - 0.5) * 2.0 * _fpAngVar;
  vec2 _fpDir = vec2(cos(_fpLa), sin(_fpLa));
  vec2 _fpDrift = _fpDir * u_time * ${uniforms.speed} * 0.06 * _fpLs;
  float _fpDens = ${uniforms.particleDensity} * (1.0 + 0.4 * _fpLk);
  vec2 _fpCs = rotate2D((uv - 0.5) * _fpAr, radians(${uniforms.rotation})) + 0.5;
  vec2 _fpQ = _fpCs * _fpDens - _fpDrift;
  vec2 _fpCid = floor(_fpQ);
  vec2 _fpCuv = fract(_fpQ);
  float _fpLayerA = 0.0;
  for (int _fpOy = -1; _fpOy <= 1; _fpOy++) {
    for (int _fpOx = -1; _fpOx <= 1; _fpOx++) {
      vec2 _fpOff = vec2(float(_fpOx), float(_fpOy));
      vec2 _fpNid = _fpCid + _fpOff;
      vec2 _fpH = hash22(_fpNid + _fpFi * 31.0);
      vec2 _fpH2 = hash22(_fpNid * 0.91 + _fpFi * 17.3);
      vec2 _fpJit = (_fpH - 0.5) * ${uniforms.randomness};
      vec2 _fpPerp = vec2(-_fpDir.y, _fpDir.x);
      float _fpSwP = _fpH2.x * 6.2831 + u_time * (0.6 + _fpH2.y * 1.2);
      vec2 _fpSwO = _fpPerp * sin(_fpSwP) * ${uniforms.sway} * 0.35;
      vec2 _fpCp = vec2(0.5) + _fpJit + _fpSwO;
      float _fpDist = distance(_fpCuv - _fpOff, _fpCp);
      float _fpSm = mix(1.0 - ${uniforms.sizeVariance}, 1.0, _fpH2.x);
      float _fpPr = mix(0.02, 0.18, clamp(${uniforms.particleSize}, 0.0, 4.0) * 0.25) * _fpSm;
      float _fpSoft = mix(0.0008, _fpPr, ${uniforms.particleSoftness});
      float _fpDot = 1.0 - smoothstep(_fpPr - _fpSoft, _fpPr, _fpDist);
      float _fpTw = 0.5 + 0.5 * sin(u_time * 2.2 * (0.6 + _fpH.y) + _fpH2.x * 6.2831);
      float _fpA = _fpDot * mix(1.0, _fpTw, ${uniforms.twinkle});
      _fpLayerA = max(_fpLayerA, _fpA);
    }
  }
  _fpAccum += ${uniforms.particleColor} * _fpLayerA;
  _fpAlphaSum = max(_fpAlphaSum, _fpLayerA);
}
_stage_col = _fpAccum;
_stage_a = clamp(_fpAlphaSum, 0.0, 1.0);`,
    };
  }
}

register(FloatingParticles);
export default FloatingParticles;
