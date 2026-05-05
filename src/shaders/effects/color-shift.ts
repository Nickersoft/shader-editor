import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  hueShift: zAngle().default(0).describe('Hue Shift'),
  saturation: zFloat(0, 2).default(1).describe('Saturation'),
  brightness: zFloat(0, 2).default(1).describe('Brightness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Color Shift',
  description: 'Hue rotation and saturation adjustment',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ColorShift extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'color-shift'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const hueShift = this.uniformName('hueShift')
    const saturation = this.uniformName('saturation')
    const brightness = this.uniformName('brightness')
    return {
      dependencies: ['rgb2hsv', 'hsv2rgb'],
      main: `
vec3 hsv = rgb2hsv(base.rgb);
hsv.x = fract(hsv.x + ${hueShift} / 360.0);
hsv.y *= ${saturation};
hsv.z *= ${brightness};
vec3 col = hsv2rgb(hsv);
return vec4(col, base.a);`,
    }
  }
}

register(ColorShift)
export default ColorShift
