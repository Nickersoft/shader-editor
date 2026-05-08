import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  threshold: zFloat(0, 1).default(0.5).describe('Threshold'),
  strength: zFloat(0, 1).default(1).describe('Strength'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Solarize',
  description: 'Inverts tones above a luminance threshold',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Solarize extends EffectNode<Config, Inputs> {
  static readonly typeId = 'solarize'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const threshold = this.uniformName('threshold')
    const strength = this.uniformName('strength')
    return {
      dependencies: ['luma'],
      main: `
base = texture(u_prevPass, uv);
float lum = luma(base.rgb);
vec3 inverted = vec3(1.0) - base.rgb;
vec3 solarized = lum > ${threshold} ? inverted : base.rgb;
return vec4(mix(base.rgb, solarized, ${strength}), base.a);`,
    }
  }
}

register(Solarize)
export default Solarize
