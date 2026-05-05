import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(1).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Grayscale',
  description: 'Desaturate to luminance',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Grayscale extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'grayscale'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['luma'],
      main: `
float lum = luma(base.rgb);
return vec4(mix(base.rgb, vec3(lum), ${amount}), base.a);`,
    }
  }
}

register(Grayscale)
export default Grayscale
