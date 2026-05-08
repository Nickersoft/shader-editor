import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColorRgba, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  color: zColorRgba().default([1, 1, 1, 1]).describe('Color'),
  cells: zInt(1, 100).default(10).describe('Cells'),
  thickness: zFloat(0, 1).default(1).describe('Thickness'),
  rotation: zAngle().default(0).describe('Rotation'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Grid',
  description: 'Simple grid lines pattern with adjustable thickness and rotation',
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
    const color = this.uniformName('color')
    const cells = this.uniformName('cells')
    const thickness = this.uniformName('thickness')
    const rotation = this.uniformName('rotation')
    return {
      dependencies: ['aastep', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
float n = float(${cells});
vec2 g = abs(fract(p * n) - 0.5);
float halfW = clamp(${thickness}, 0.0, 1.0) * 0.06;
float dx = aastep(0.5 - halfW, g.x);
float dy = aastep(0.5 - halfW, g.y);
float m = max(dx, dy);
return vec4(${color}.rgb * m, ${color}.a * m);`,
    }
  }
}

register(Grid)
export default Grid
