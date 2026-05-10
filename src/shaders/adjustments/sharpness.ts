import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(0.5).describe('Sharpness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Sharpness',
  description: 'Adjust image sharpness using a convolution kernel',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Sharpness extends EffectNode<Config, Inputs> {
  static readonly typeId = 'sharpness'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      main: `
vec2 texel = 1.0 / u_resolution;
vec4 center = texture(u_prevPass, uv);
vec4 top = texture(u_prevPass, uv + vec2(0.0, texel.y));
vec4 bottom = texture(u_prevPass, uv - vec2(0.0, texel.y));
vec4 left = texture(u_prevPass, uv - vec2(texel.x, 0.0));
vec4 right = texture(u_prevPass, uv + vec2(texel.x, 0.0));
float centerWeight = 1.0 + 4.0 * ${amount};
float neighborWeight = -${amount};
vec3 col = clamp(
  center.rgb * centerWeight
    + top.rgb * neighborWeight
    + bottom.rgb * neighborWeight
    + left.rgb * neighborWeight
    + right.rgb * neighborWeight,
  0.0, 1.0
);
return vec4(col, center.a);`,
    }
  }
}

register(Sharpness)
export default Sharpness
