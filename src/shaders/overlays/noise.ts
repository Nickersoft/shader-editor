import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1).default(0.4).describe('Intensity'),
  size: zFloat(0.25, 8, 0.05).default(1.0).describe('Size'),
  colored: zFloat(0, 1, 1).default(0.0).describe('Colored'),
  animated: zFloat(0, 1, 1).default(0.0).describe('Animated'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Noise',
  description: 'Paper-style B/W speckle grain — stack on anything for uniform white-noise overlay',
  color: '#a3a3a3',
  category: 'overlays',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Noise extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'noise'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const size = this.uniformName('size')
    const colored = this.uniformName('colored')
    const animated = this.uniformName('animated')
    return {
      dependencies: ['rotate2D', 'hash21', 'valueNoise'],
      main: `
float phaseT = u_time * ${animated} * 30.0;
float frac = fract(phaseT);
float seedA = floor(phaseT);
float seedB = seedA + 1.0;
vec2 grainUV = uv * 1000.0 / max(${size}, 0.01);
vec2 jumpA = vec2(hash21(vec2(seedA, 1.7)), hash21(vec2(seedA, 8.3))) * 1000.0;
vec2 jumpB = vec2(hash21(vec2(seedB, 1.7)), hash21(vec2(seedB, 8.3))) * 1000.0;
float nA = mix(
  valueNoise(rotate2D(grainUV + jumpA, 1.0) + vec2(3.0)),
  valueNoise(rotate2D(grainUV + jumpA, 2.0) + vec2(-1.0)),
  0.5
);
float nB = mix(
  valueNoise(rotate2D(grainUV + jumpB, 1.0) + vec2(3.0)),
  valueNoise(rotate2D(grainUV + jumpB, 2.0) + vec2(-1.0)),
  0.5
);
float dither = hash21(uv * u_resolution + vec2(seedA * 13.7, 0.0));
float n = mix(nA, nB, smoothstep(dither - 0.05, dither + 0.05, frac));
n = pow(n, 1.3);
float v = n * 2.0 - 1.0;
vec3 speckle = ${colored} > 0.5
  ? vec3(step(0.0, v + 0.07), step(0.0, v), step(0.0, v - 0.07))
  : vec3(step(0.0, v));
float strength = pow(${intensity} * abs(v), 0.8);
return vec4(mix(base.rgb, speckle, 0.35 * strength), base.a);`,
    }
  }
}

register(Noise)
export default Noise
