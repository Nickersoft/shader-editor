import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 3).default(0.5).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Sharpness',
  description: 'Edge-aware sharpening (unsharp mask)',
  color: '#a855f7',
  category: 'effects',
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
vec3 c  = texture(u_prevPass, uv).rgb;
vec3 n1 = texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb;
vec3 n2 = texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb;
vec3 n3 = texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb;
vec3 n4 = texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb;
vec3 blurred = (n1 + n2 + n3 + n4) * 0.25;
return vec4(c + (c - blurred) * ${amount}, 1.0);`,
    }
  }
}

register(Sharpness)
export default Sharpness
