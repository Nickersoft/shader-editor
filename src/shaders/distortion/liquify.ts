import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.4, 0.005).default(0.05).describe('Amount'),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Liquify',
  description: 'Soft noise-driven liquid warp',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Liquify extends EffectNode<Config, Inputs> {
  static readonly typeId = 'liquify'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D'],
      main: `
float t = u_time * ${speed};
float dx = simplex2D(uv * ${scale} + vec2(t, 0.0));
float dy = simplex2D(uv * ${scale} + vec2(0.0, t + 7.3));
return texture(u_prevPass, uv + vec2(dx, dy) * ${amount});`,
    }
  }
}

register(Liquify)
export default Liquify
