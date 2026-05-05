import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 30, 0.5).default(4.0).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Blur',
  description: 'Symmetric Gaussian blur',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Blur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['gaussian9'],
      main: `
vec2 texel = 1.0 / u_resolution;
return gaussian9(u_prevPass, uv, texel * ${amount});`,
    }
  }
}

register(Blur)
export default Blur
