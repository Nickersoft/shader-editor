import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.3, 0.005).default(0.04).describe('Refraction'),
  scale: zFloat(1, 50, 0.5).default(8.0).describe('Scale'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glass',
  description: 'Frosted-glass refraction',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Glass extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glass'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const scale = this.uniformName('scale')
    return {
      dependencies: ['simplex2D'],
      main: `
vec2 q = uv * ${scale};
float e = 0.01;
float n  = simplex2D(q);
float nx = simplex2D(q + vec2(e, 0.0));
float ny = simplex2D(q + vec2(0.0, e));
vec2 grad = vec2(nx - n, ny - n) / e;
return texture(u_prevPass, uv + grad * ${amount});`,
    }
  }
}

register(Glass)
export default Glass
