import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  frequency: zFloat(1, 200, 1).default(30.0).describe('Frequency'),
  amplitude: zFloat(0, 0.3, 0.005).default(0.02).describe('Amplitude'),
  speed: zFloat(0, 10, 0.05).default(2.0).describe('Speed'),
  falloff: zFloat(0, 10, 0.1).default(2.0).describe('Falloff'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Ripples',
  description: 'Concentric ripples from a focal point',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Ripples extends EffectNode<Config, Inputs> {
  static readonly typeId = 'ripples'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const frequency = this.uniformName('frequency')
    const amplitude = this.uniformName('amplitude')
    const speed = this.uniformName('speed')
    const falloff = this.uniformName('falloff')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d);
float wave = sin(r * ${frequency} - u_time * ${speed}) * exp(-r * ${falloff}) * ${amplitude};
return texture(u_prevPass, uv + normalize(d + 1e-6) * wave);`,
    }
  }
}

register(Ripples)
export default Ripples
