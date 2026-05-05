import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  radius: zFloat(0.01, 1).default(0.4).describe('Radius'),
  strength: zFloat(-1, 1).default(0.5).describe('Strength'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Bulge',
  description: 'Pinches or bulges the previous content around a focal point',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Bulge extends EffectNode<Config, Inputs> {
  static readonly typeId = 'bulge'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const centerX = this.uniformName('centerX')
    const centerY = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const strength = this.uniformName('strength')
    return {
      main: `
vec2 center = vec2(${centerX}, ${centerY});
vec2 d = uv - center;
float r = length(d);
float falloff = 1.0 - smoothstep(0.0, ${radius}, r);
vec2 distorted = uv - d * falloff * ${strength};
return texture(u_prevPass, distorted);`,
    }
  }
}

register(Bulge)
export default Bulge
