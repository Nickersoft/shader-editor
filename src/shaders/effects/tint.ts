import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1.0, 0.7, 0.4]).describe('Color'),
  amount: zFloat(0, 1).default(0.5).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Tint',
  description: 'Tint with a single color',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Tint extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'tint'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const amount = this.uniformName('amount')
    return {
      main: `
return vec4(mix(base.rgb, base.rgb * ${color} * 1.4, ${amount}), base.a);`,
    }
  }
}

register(Tint)
export default Tint
