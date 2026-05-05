import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  radius: zFloat(0.05, 1.5).default(0.4).describe('Radius'),
  angle: zFloat(-720, 720, 1).default(90.0).describe('Angle (deg)'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Twirl',
  description: 'Local rotation, falls off with distance',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Twirl extends EffectNode<Config, Inputs> {
  static readonly typeId = 'twirl'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const angle = this.uniformName('angle')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d);
float falloff = 1.0 - smoothstep(0.0, ${radius}, r);
float a = ${angle} * 3.14159 / 180.0 * falloff;
float ca = cos(a), sa = sin(a);
vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
return texture(u_prevPass, c + rd);`,
    }
  }
}

register(Twirl)
export default Twirl
