import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zBool, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.5, 0.5, 0.8]).describe('Tint Color'),
  amount: zFloat(0, 1).default(0.5).describe('Amount'),
  preserveLuminosity: zBool().default(false).describe('Preserve Luminosity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Tint',
  description: 'Apply a color tint to the image',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Tint extends EffectNode<Config, Inputs> {
  static readonly typeId = 'tint'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const amount = this.uniformName('amount')
    const preserveLuminosity = this.uniformName('preserveLuminosity')
    return {
      main: `
base = texture(u_prevPass, uv);
vec3 tinted = mix(base.rgb, ${color}, ${amount});
vec3 result = tinted;
if (${preserveLuminosity}) {
  vec3 w = vec3(0.299, 0.587, 0.114);
  float originalLum = dot(base.rgb, w);
  float tintedLum = dot(tinted, w);
  result = tinted * (originalLum / max(tintedLum, 1e-4));
}
return vec4(result, base.a);`,
    }
  }
}

register(Tint)
export default Tint
