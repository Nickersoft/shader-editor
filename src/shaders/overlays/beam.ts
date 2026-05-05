import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1.0, 0.95, 0.8]).describe('Color'),
  angle: zAngle(1).default(30.0).describe('Angle'),
  thickness: zFloat(0.01, 1).default(0.15).describe('Thickness'),
  intensity: zFloat(0, 2).default(0.7).describe('Intensity'),
  offset: zFloat(-1, 1).default(0.0).describe('Offset'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Beam',
  description: 'Soft directional light beam',
  color: '#fde68a',
  category: 'overlays',
  defaultBlendMode: 'add',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Beam extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'beam'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const angle = this.uniformName('angle')
    const thickness = this.uniformName('thickness')
    const intensity = this.uniformName('intensity')
    const offset = this.uniformName('offset')
    return {
      dependencies: ['rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${angle} * 3.14159 / 180.0);
float d = abs(p.y - ${offset});
float a = exp(-d * d / max(${thickness} * ${thickness}, 1e-4)) * ${intensity};
return vec4(${color} * a, a);`,
    }
  }
}

register(Beam)
export default Beam
