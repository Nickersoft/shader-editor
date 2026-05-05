import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  radius: zFloat(0.001, 1, 0.001).default(0.35).describe('Radius'),
  points: zFloat(3, 12, 1).default(5).describe('Points'),
  inset: zFloat(2.001, 8, 0.01).default(2.5).describe('Inset'),
  rotation: zAngle(1).default(0).describe('Rotation'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  fillColor: zColor().default([1, 1, 1]).describe('Fill'),
  strokeColor: zColor().default([0, 0, 0]).describe('Stroke'),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe('Stroke Width'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Star',
  description: 'N-pointed star',
  color: '#3b82f6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Star extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'star'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const r = this.uniformName('radius')
    const pts = this.uniformName('points')
    const inset = this.uniformName('inset')
    const rot = this.uniformName('rotation')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const fill = this.uniformName('fillColor')
    const stroke = this.uniformName('strokeColor')
    const sw = this.uniformName('strokeWidth')
    return {
      dependencies: ['aastep', 'sdStar', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rot} * 3.14159 / 180.0);
float d = sdStar(p, ${r}, ${pts}, ${inset});
float interior = 1.0 - aastep(0.0, d);
float strokeMask = (1.0 - aastep(${sw} * 0.5, abs(d))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeMask);
return vec4(col, max(interior, strokeMask));`,
    }
  }
}

register(Star)
export default Star
