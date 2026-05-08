import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  shift: zFloat(-180, 180, 1).default(0).describe('Shift'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Hue Shift',
  description: 'Rotate hue around the color wheel',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class HueShift extends EffectNode<Config, Inputs> {
  static readonly typeId = 'hue-shift'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const shift = this.uniformName('shift')
    return {
      dependencies: ['rgb2hsv', 'hsv2rgb'],
      main: `
base = texture(u_prevPass, uv);
vec3 hsv = rgb2hsv(base.rgb);
hsv.x = fract(hsv.x + ${shift} / 360.0);
return vec4(hsv2rgb(hsv), base.a);`,
    }
  }
}

register(HueShift)
export default HueShift
