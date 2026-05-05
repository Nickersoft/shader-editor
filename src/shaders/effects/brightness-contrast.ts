import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  brightness: zFloat(-1, 1).default(0).describe('Brightness'),
  contrast: zFloat(0, 3).default(1).describe('Contrast'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Brightness/Contrast',
  description: 'Brightness and contrast adjustment',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class BrightnessContrast extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'brightness-contrast'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const brightness = this.uniformName('brightness')
    const contrast = this.uniformName('contrast')
    return {
      main: `
vec3 col = (base.rgb - 0.5) * ${contrast} + 0.5 + ${brightness};
return vec4(col, base.a);`,
    }
  }
}

register(BrightnessContrast)
export default BrightnessContrast
