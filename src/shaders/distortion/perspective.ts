import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  horizontal: zFloat(-1, 1).default(0.0).describe('Horizontal'),
  vertical: zFloat(-1, 1).default(0.0).describe('Vertical'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Perspective',
  description: 'Trapezoidal perspective skew',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Perspective extends EffectNode<Config, Inputs> {
  static readonly typeId = 'perspective'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const horizontal = this.uniformName('horizontal')
    const vertical = this.uniformName('vertical')
    return {
      main: `
vec2 q = uv - 0.5;
float scaleX = 1.0 + ${vertical} * q.y;
float scaleY = 1.0 + ${horizontal} * q.x;
q = q / vec2(scaleX, scaleY);
return texture(u_prevPass, q + 0.5);`,
    }
  }
}

register(Perspective)
export default Perspective
