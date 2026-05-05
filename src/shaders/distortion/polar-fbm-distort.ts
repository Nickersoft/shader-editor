import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 3, 0.05).default(1.2).describe('Amount'),
  bias: zFloat(0, 2).default(0.8).describe('Bias'),
  noiseScale: zFloat(0.01, 5).default(1.4).describe('Noise Scale'),
  iterations: zInt(1, 8).default(6).describe('Iterations'),
  speed: zFloat(0, 4, 0.05).default(1.0).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Polar FBM Distort',
  description: 'Radial UV warp via polar fbm — turns rings/circles into smoky shapes',
  color: '#a78bfa',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class PolarFbmDistort extends EffectNode<Config, Inputs> {
  static readonly typeId = 'polar-fbm-distort'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const bias = this.uniformName('bias')
    const noiseScale = this.uniformName('noiseScale')
    const iterations = this.uniformName('iterations')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash21'],
      functions: `
#ifndef PFD_TWO_PI
#define PFD_TWO_PI 6.28318530718
#endif
#ifndef PFD_PI
#define PFD_PI 3.14159265359
#endif
float pfdValueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 pfdFbm(vec2 n0, vec2 n1, int iters) {
  vec2 total = vec2(0.0);
  float amp = 0.4;
  for (int i = 0; i < 8; i++) {
    if (i >= iters) break;
    total.x += pfdValueNoise(n0) * amp;
    total.y += pfdValueNoise(n1) * amp;
    n0 *= 1.99;
    n1 *= 1.99;
    amp *= 0.65;
  }
  return total;
}
float pfdSampleNoise(vec2 centred, vec2 polar, float t, float scale, int iters) {
  vec2 left = polar + 0.03 * t;
  float period = max(abs(scale * PFD_TWO_PI), 1e-6);
  vec2 right = vec2(fract(polar.x / period) * period, polar.y) + 0.03 * t;
  vec2 noise = pfdFbm(left, right, iters);
  return mix(noise.y, noise.x, smoothstep(-0.25, 0.25, centred.x));
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 c = (uv - 0.5) * _ar;
float t = u_time * ${speed};
float cycle = 3.0;
float period = 2.0 * cycle;
float t1 = fract((0.1 * t + cycle) / period) * period;
float t2 = fract((0.1 * t) / period) * period;
float blend = 0.5 + 0.5 * sin(0.1 * t * PFD_PI / cycle - 0.5 * PFD_PI);
float ang = atan(c.y, c.x) + 0.001;
float l = length(c);
float radialOffset = 0.5 * l - inversesqrt(max(1e-4, l));
vec2 polar1 = vec2(ang, t1 - radialOffset) * ${noiseScale};
vec2 polar2 = vec2(ang, t2 - radialOffset) * ${noiseScale};
float n1 = pfdSampleNoise(c, polar1, t, ${noiseScale}, ${iterations});
float n2 = pfdSampleNoise(c, polar2, t, ${noiseScale}, ${iterations});
float n = mix(n1, n2, blend);
vec2 d = (uv - 0.5) * (${bias} + ${amount} * n);
return texture(u_prevPass, d + 0.5);`,
    }
  }
}

register(PolarFbmDistort)
export default PolarFbmDistort
