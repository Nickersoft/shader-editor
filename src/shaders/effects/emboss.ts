import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 4, 0.05).default(1).describe('Amount'),
  angle: zAngle().default(135).describe('Light Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Emboss',
  description: 'Embossed relief',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Emboss extends EffectNode<Config, Inputs> {
  static readonly typeId = 'emboss'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const angle = this.uniformName('angle')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution;
float a = ${angle} * 3.14159 / 180.0;
vec2 dir = vec2(cos(a), sin(a)) * texel;
float l1 = luma(texture(u_prevPass, uv + dir).rgb);
float l2 = luma(texture(u_prevPass, uv - dir).rgb);
float v = (l1 - l2) * ${amount} + 0.5;
return vec4(vec3(v), 1.0);`,
    }
  }
}

register(Emboss)
export default Emboss
