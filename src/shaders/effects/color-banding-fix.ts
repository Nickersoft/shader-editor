import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 2).default(1).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Color Banding Fix',
  description: 'Paper-style sub-LSB dithering to hide smooth-gradient banding',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ColorBandingFix extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'color-banding-fix'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['colorBandingFix'],
      main: `
vec3 fixedColor = colorBandingFix(base.rgb);
return vec4(mix(base.rgb, fixedColor, ${amount}), base.a);`,
    }
  }
}

register(ColorBandingFix)
export default ColorBandingFix
