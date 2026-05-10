import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 3).default(1).describe('Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Saturation',
  description: 'Adjust color saturation intensity',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Saturation extends EffectNode<Config, Inputs> {
  static readonly typeId = 'saturation'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    return {
      main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
return vec4(mix(vec3(lum), base.rgb, ${intensity}), base.a);`,
    }
  }
}

register(Saturation)
export default Saturation
