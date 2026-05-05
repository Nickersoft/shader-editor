import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  radius: zFloat(0.001, 1, 0.001).default(0.3).describe('Radius'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  fillColor: zColor().default([1, 1, 1]).describe('Fill'),
  strokeColor: zColor().default([0, 0, 0]).describe('Stroke'),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe('Stroke Width'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Circle',
  description: 'Solid or stroked circle',
  color: '#3b82f6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Circle extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'circle'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const radius = this.uniformName('radius')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const fill = this.uniformName('fillColor')
    const stroke = this.uniformName('strokeColor')
    const sw = this.uniformName('strokeWidth')
    return {
      dependencies: ['aastep', 'sdCircle'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float d = sdCircle(p, ${radius});
float interior = 1.0 - aastep(0.0, d);
float strokeMask = (1.0 - aastep(${sw} * 0.5, abs(d))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeMask);
return vec4(col, max(interior, strokeMask));`,
    }
  }
}

register(Circle)
export default Circle
