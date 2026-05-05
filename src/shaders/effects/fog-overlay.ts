import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.85, 0.9, 0.95]).describe('Fog Color'),
  amount: zFloat(0, 1).default(0.3).describe('Amount'),
  softness: zFloat(0, 1).default(0.6).describe('Softness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Fog Overlay',
  description: 'Atmospheric haze tint',
  color: '#cbd5e1',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FogOverlay extends EffectNode<Config, Inputs> {
  static readonly typeId = 'fog-overlay'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const amount = this.uniformName('amount')
    const softness = this.uniformName('softness')
    return {
      dependencies: ['simplex2D'],
      main: `
vec4 src = texture(u_prevPass, uv);
float n = simplex2D(uv * 4.0 + u_time * 0.1) * 0.5 + 0.5;
float w = mix(${amount}, n * ${amount}, ${softness});
return vec4(mix(src.rgb, ${color}, w), src.a);`,
    }
  }
}

register(FogOverlay)
export default FogOverlay
