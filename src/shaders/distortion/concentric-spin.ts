import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  rings: zFloat(1, 30, 1).default(8.0).describe('Rings'),
  speed: zFloat(-4, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Concentric Spin',
  description: 'Concentric rings rotating at different rates',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ConcentricSpin extends EffectNode<Config, Inputs> {
  static readonly typeId = 'concentric-spin'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const rings = this.uniformName('rings')
    const speed = this.uniformName('speed')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d);
float band = floor(r * ${rings});
float a = sin(band * 1.7) * u_time * ${speed};
float ca = cos(a), sa = sin(a);
vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
return texture(u_prevPass, c + rd);`,
    }
  }
}

register(ConcentricSpin)
export default ConcentricSpin
