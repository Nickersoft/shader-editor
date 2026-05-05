import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(2, 40, 0.5).default(8.0).describe('Cells'),
  amount: zFloat(0, 0.5, 0.005).default(0.05).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Shatter',
  description: 'Voronoi cell fragments displaced',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Shatter extends EffectNode<Config, Inputs> {
  static readonly typeId = 'shatter'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const scale = this.uniformName('scale')
    const amount = this.uniformName('amount')
    return {
      dependencies: ['hash2'],
      main: `
vec2 q = uv * ${scale};
vec2 cell = floor(q);
vec2 offset = (hash2(cell) - 0.5) * 2.0 * ${amount};
return texture(u_prevPass, uv + offset);`,
    }
  }
}

register(Shatter)
export default Shatter
