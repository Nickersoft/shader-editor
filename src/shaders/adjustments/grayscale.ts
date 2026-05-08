import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(1).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Grayscale',
  description: 'Convert colors to black and white',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Grayscale extends EffectNode<Config, Inputs> {
  static readonly typeId = 'grayscale'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
return vec4(mix(base.rgb, vec3(lum), ${amount}), base.a);`,
    }
  }
}

register(Grayscale)
export default Grayscale
