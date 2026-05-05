import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(0.3).describe('Amount'),
  scale: zFloat(8, 300, 1).default(80).describe('Scale'),
  fiberAngle: zAngle().default(0).describe('Fiber Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Paper',
  description: 'Paper-texture overlay (fiber-noise multiply)',
  color: '#fef3c7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Paper extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'paper'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const scale = this.uniformName('scale')
    const fiberAngle = this.uniformName('fiberAngle')
    return {
      dependencies: ['simplex2D', 'rotate2D'],
      main: `
vec2 q = rotate2D(uv * ${scale}, ${fiberAngle} * 3.14159 / 180.0);
float n = simplex2D(q) * 0.5 + simplex2D(q * 3.0) * 0.25 + simplex2D(q * 9.0) * 0.125;
float w = 1.0 - ${amount} * (0.5 - n);
return vec4(base.rgb * w, base.a);`,
    }
  }
}

register(Paper)
export default Paper
