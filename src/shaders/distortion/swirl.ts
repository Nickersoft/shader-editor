import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  strength: zFloat(-20, 20, 0.1).default(4.0).describe('Strength'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Swirl',
  description: 'Radius-dependent rotation across the canvas',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Swirl extends EffectNode<Config, Inputs> {
  static readonly typeId = 'swirl'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const strength = this.uniformName('strength')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d);
float a = r * ${strength};
float ca = cos(a), sa = sin(a);
vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
return texture(u_prevPass, c + rd);`,
    }
  }
}

register(Swirl)
export default Swirl
