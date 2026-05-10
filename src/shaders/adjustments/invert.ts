import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(1).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Invert',
  description: 'Color inversion',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Invert extends EffectNode<Config, Inputs> {
  static readonly typeId = 'invert'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      main: `
base = texture(u_prevPass, uv);
return vec4(mix(base.rgb, 1.0 - base.rgb, ${amount}), base.a);`,
    }
  }
}

register(Invert)
export default Invert
