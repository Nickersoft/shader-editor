import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 3).default(1).describe('Saturation'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Saturation',
  description: 'Adjust saturation',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Saturation extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'saturation'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['luma'],
      main: `
float lum = luma(base.rgb);
return vec4(mix(vec3(lum), base.rgb, ${amount}), base.a);`,
    }
  }
}

register(Saturation)
export default Saturation
