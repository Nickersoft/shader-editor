import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amplitude: zFloat(0, 0.2, 0.001).default(0.02).describe('Amplitude'),
  frequency: zFloat(1, 60, 0.5).default(12).describe('Frequency'),
  speed: zFloat(0, 4, 0.05).default(0.6).describe('Speed'),
  focalX: zFloat(0, 1).default(0.5).describe('Focal X'),
  focalY: zFloat(0, 1).default(0.5).describe('Focal Y'),
  noiseAmount: zFloat(0, 1).default(0.5).describe('Noise'),
  noiseScale: zFloat(0.1, 20, 0.1).default(4).describe('Noise Scale'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Water Ripple',
  description: 'Radial wave displacement with FBM modulation',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class WaterRipple extends EffectNode<Config, Inputs> {
  static readonly typeId = 'water-ripple'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amplitude = this.uniformName('amplitude')
    const frequency = this.uniformName('frequency')
    const speed = this.uniformName('speed')
    const focalX = this.uniformName('focalX')
    const focalY = this.uniformName('focalY')
    const noiseAmount = this.uniformName('noiseAmount')
    const noiseScale = this.uniformName('noiseScale')
    return {
      dependencies: ['simplex2D', 'fbm'],
      main: `
vec2 c = vec2(${focalX}, ${focalY});
vec2 d = uv - c;
float r = length(d);
float t = u_time * ${speed};
float ring = sin(r * ${frequency} - t);
float n = fbm(uv * ${noiseScale} + vec2(t * 0.2, 0.0), 3.0, 2.0, 0.5);
vec2 dir = r > 1e-4 ? d / r : vec2(0.0);
vec2 push = dir * ring * ${amplitude}
          + vec2(n, n) * ${amplitude} * ${noiseAmount};
return texture(u_prevPass, uv - push);`,
    }
  }
}

register(WaterRipple)
export default WaterRipple
