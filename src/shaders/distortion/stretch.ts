import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scaleX: zFloat(0.1, 4).default(1.0).describe('Scale X'),
  scaleY: zFloat(0.1, 4).default(1.0).describe('Scale Y'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Stretch',
  description: 'Stretch along the X / Y axes',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Stretch extends EffectNode<Config, Inputs> {
  static readonly typeId = 'stretch'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const sx = this.uniformName('scaleX')
    const sy = this.uniformName('scaleY')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = (uv - c) / vec2(${sx}, ${sy});
return texture(u_prevPass, c + d);`,
    }
  }
}

register(Stretch)
export default Stretch
