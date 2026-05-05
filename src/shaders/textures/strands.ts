import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  count: zFloat(4, 200, 1).default(30.0).describe('Count'),
  amplitude: zFloat(0, 0.3, 0.001).default(0.05).describe('Amplitude'),
  frequency: zFloat(0.1, 20, 0.1).default(4.0).describe('Frequency'),
  speed: zFloat(0, 4, 0.05).default(0).describe('Speed'),
  thickness: zFloat(0.01, 1).default(0.4).describe('Thickness'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Strands',
  description: 'Wavy vertical strands',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Strands extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'strands'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const count = this.uniformName('count')
    const amplitude = this.uniformName('amplitude')
    const frequency = this.uniformName('frequency')
    const speed = this.uniformName('speed')
    const thickness = this.uniformName('thickness')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float wave = sin(p.y * ${frequency} + u_time * ${speed}) * ${amplitude};
float t = fract((p.x + wave) * ${count});
float d = abs(t - 0.5);
float m = 1.0 - aastep(${thickness} * 0.5, d);
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(Strands)
export default Strands
