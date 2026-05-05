import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  count: zFloat(2, 100, 1).default(20.0).describe('Tile Count'),
  amount: zFloat(0, 0.3, 0.005).default(0.05).describe('Distortion'),
  angle: zAngle().default(0.0).describe('Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glass Tiles',
  description: 'Fluted-glass / vertical tile refraction',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class GlassTiles extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glass-tiles'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const count = this.uniformName('count')
    const amount = this.uniformName('amount')
    const angle = this.uniformName('angle')
    return {
      dependencies: ['rotate2D'],
      main: `
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0);
float t = q.x * ${count};
float bend = (fract(t) - 0.5) * ${amount};
q.x += bend;
vec2 q2 = rotate2D(q, -${angle} * 3.14159 / 180.0) + 0.5;
return texture(u_prevPass, q2);`,
    }
  }
}

register(GlassTiles)
export default GlassTiles
