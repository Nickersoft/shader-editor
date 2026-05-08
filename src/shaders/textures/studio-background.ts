import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.85, 0.86, 0.93]).describe('Color'),
  keyColor: zColor().default([0.83, 0.89, 0.92]).describe('Key Color'),
  keyIntensity: zFloat(0, 200, 1).default(40).describe('Key Intensity'),
  keySoftness: zFloat(0, 100, 1).default(50).describe('Key Softness'),
  fillColor: zColor().default([0.83, 0.89, 0.92]).describe('Fill Color'),
  fillIntensity: zFloat(0, 200, 1).default(10).describe('Fill Intensity'),
  fillSoftness: zFloat(0, 100, 1).default(70).describe('Fill Softness'),
  fillAngle: zFloat(0, 180, 1).default(70).describe('Fill Angle'),
  backColor: zColor().default([0.78, 0.83, 0.91]).describe('Back Color'),
  backIntensity: zFloat(0, 200, 1).default(20).describe('Back Intensity'),
  backSoftness: zFloat(0, 100, 1).default(80).describe('Back Softness'),
  brightness: zFloat(0, 200, 1).default(20).describe('Brightness'),
  vignette: zFloat(0, 100, 1).default(0).describe('Vignette'),
  center: zCenter().default([0.5, 0.8]).describe('Center'),
  lightTarget: zFloat(0, 200, 1).default(100).describe('Light Target'),
  wallCurvature: zFloat(0, 100, 1).default(10).describe('Wall Curvature'),
  ambientIntensity: zFloat(0, 200, 1).default(50).describe('Ambient Intensity'),
  ambientSpeed: zFloat(0, 20, 0.1).default(2).describe('Ambient Speed'),
  seed: zFloat(0, 100, 0.1).default(0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Studio Background',
  description: 'Multi-light studio background with ambient motion',
  color: '#94a3b8',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class StudioBackground extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'studio-background'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const keyColor = this.uniformName('keyColor')
    const keyIntensity = this.uniformName('keyIntensity')
    const keySoftness = this.uniformName('keySoftness')
    const fillColor = this.uniformName('fillColor')
    const fillIntensity = this.uniformName('fillIntensity')
    const fillSoftness = this.uniformName('fillSoftness')
    const fillAngle = this.uniformName('fillAngle')
    const backColor = this.uniformName('backColor')
    const backIntensity = this.uniformName('backIntensity')
    const backSoftness = this.uniformName('backSoftness')
    const brightness = this.uniformName('brightness')
    const vignette = this.uniformName('vignette')
    const center = this.uniformName('center')
    const lightTarget = this.uniformName('lightTarget')
    const wallCurvature = this.uniformName('wallCurvature')
    const ambientIntensity = this.uniformName('ambientIntensity')
    const ambientSpeed = this.uniformName('ambientSpeed')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['fbm', 'simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = uv * _ar;
vec2 ctr = ${center} * _ar;

// Cove curvature — bend the floor up into the back wall.
float curve = ${wallCurvature} / 100.0;
float floorMix = smoothstep(0.0, 1.0, 1.0 - uv.y);
floorMix = mix(floorMix, pow(floorMix, mix(1.0, 4.0, curve)), 0.5);

vec3 bg = ${color} * (${brightness} / 100.0 * 0.6 + 0.7);

// Key light — overhead spot near center, biased downward by lightTarget.
float lt = ${lightTarget} / 100.0;
vec2 keyAim = vec2(ctr.x, mix(0.2 * _ar.y, 0.8 * _ar.y, lt));
float keyR = distance(p, keyAim);
float keyS = max(${keySoftness} / 100.0, 0.05) * 0.9 + 0.1;
float keyMask = exp(-pow(keyR / keyS, 2.0)) * (${keyIntensity} / 100.0);
vec3 col = bg + ${keyColor} * keyMask;

// Fill lights — left + right at fillAngle off vertical.
float fa = radians(${fillAngle});
vec2 lDir = vec2(-sin(fa), cos(fa));
vec2 rDir = vec2(sin(fa), cos(fa));
vec2 lPos = ctr + lDir * 0.7 * _ar.y;
vec2 rPos = ctr + rDir * 0.7 * _ar.y;
float fillS = max(${fillSoftness} / 100.0, 0.05) * 1.1 + 0.1;
float lMask = exp(-pow(distance(p, lPos) / fillS, 2.0));
float rMask = exp(-pow(distance(p, rPos) / fillS, 2.0));
col += ${fillColor} * (lMask + rMask) * (${fillIntensity} / 100.0) * 0.7;

// Back wash — broad upper gradient.
float backS = max(${backSoftness} / 100.0, 0.05) * 1.4 + 0.2;
float backMask = exp(-pow((1.0 - uv.y) / backS, 2.0)) * (${backIntensity} / 100.0);
col += ${backColor} * backMask * 0.8;

// Ambient drifting noise.
float t = u_time * ${ambientSpeed} * 0.05 + ${seed};
float drift = fbm(p * 1.6 + vec2(t, t * 0.7), 4.0, 2.0, 0.5);
col += vec3(0.04, 0.05, 0.07) * drift * (${ambientIntensity} / 100.0);

// Vignette.
float vig = ${vignette} / 100.0;
float r = distance(uv, vec2(0.5));
col *= mix(1.0, smoothstep(0.85, 0.15, r), vig);

return vec4(col * mix(0.9, 1.1, floorMix), 1.0);`,
    }
  }
}

register(StudioBackground)
export default StudioBackground
