import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(1, 64, 0.5).default(12.0).describe('Scale'),
  lineWidth: zFloat(0.001, 0.5, 0.001).default(0.05).describe('Line Width'),
  rotation: zAngle().default(0).describe('Rotation'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Grid',
  description: 'Crossed-line grid',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Grid extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'grid'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const scale = this.uniformName('scale')
    const lineWidth = this.uniformName('lineWidth')
    const rotation = this.uniformName('rotation')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
vec2 g = abs(fract(p * ${scale}) - 0.5);
float dx = aastep(${lineWidth} * 0.5, g.x);
float dy = aastep(${lineWidth} * 0.5, g.y);
float m = 1.0 - min(dx, dy);
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(Grid)
export default Grid
