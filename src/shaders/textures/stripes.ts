import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  frequency: zFloat(1, 60, 0.5).default(12.0).describe('Frequency'),
  duty: zFloat(0.05, 0.95).default(0.5).describe('Duty'),
  angle: zAngle().default(0).describe('Angle'),
  softness: zFloat(0, 1).default(0).describe('Softness'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Stripes',
  description: 'Parallel stripes (softness=1 for smooth band falloff)',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Stripes extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'stripes'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const frequency = this.uniformName('frequency')
    const duty = this.uniformName('duty')
    const angle = this.uniformName('angle')
    const softness = this.uniformName('softness')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${angle} * 3.14159 / 180.0);
float t = fract(p.x * ${frequency});
float hard = aastep(${duty}, t);
float soft = smoothstep(0.0, ${duty}, t) * (1.0 - smoothstep(1.0 - ${duty}, 1.0, t));
float m = mix(hard, soft, ${softness});
return vec4(mix(${color2}, ${color1}, m), 1.0);`,
    }
  }
}

register(Stripes)
export default Stripes
