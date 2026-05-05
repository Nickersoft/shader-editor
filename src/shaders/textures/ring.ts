import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  frequency: zFloat(0.5, 60, 0.5).default(8.0).describe('Frequency'),
  duty: zFloat(0.05, 0.95).default(0.5).describe('Duty'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Ring',
  description: 'Concentric rings',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Ring extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'ring'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const frequency = this.uniformName('frequency')
    const duty = this.uniformName('duty')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float r = length(p);
float t = fract(r * ${frequency});
float m = aastep(${duty}, t);
return vec4(mix(${color2}, ${color1}, m), 1.0);`,
    }
  }
}

register(Ring)
export default Ring
