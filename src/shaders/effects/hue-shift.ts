import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 360, 1).default(0).describe('Hue'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Hue Shift',
  description: 'Rotate the hue wheel',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class HueShift extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'hue-shift'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['rgb2hsv', 'hsv2rgb'],
      main: `
vec3 h = rgb2hsv(base.rgb);
h.x = fract(h.x + ${amount} / 360.0);
return vec4(hsv2rgb(h), base.a);`,
    }
  }
}

register(HueShift)
export default HueShift
