import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(-1, 2).default(0.5).describe('Vibrance'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Vibrance',
  description: 'Saturate less-saturated colors more',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Vibrance extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'vibrance'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['luma'],
      main: `
float mx = max(base.r, max(base.g, base.b));
float mn = min(base.r, min(base.g, base.b));
float sat = mx - mn;
float lum = luma(base.rgb);
float w = (1.0 - sat) * ${amount};
return vec4(mix(vec3(lum), base.rgb, 1.0 + w), base.a);`,
    }
  }
}

register(Vibrance)
export default Vibrance
