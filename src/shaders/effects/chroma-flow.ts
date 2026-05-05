import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 1).default(0.4).describe('Amount'),
  scale: zFloat(0.5, 10, 0.1).default(3).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Chroma Flow',
  description: 'Animated chromatic flow tint',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ChromaFlow extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'chroma-flow'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    return {
      main: `
float t = u_time * ${speed};
vec3 tint = 0.5 + 0.5 * cos(uv.xyx * ${scale} * 6.28318 + t + vec3(0.0, 2.094, 4.188));
return vec4(mix(base.rgb, base.rgb * tint, ${amount}), base.a);`,
    }
  }
}

register(ChromaFlow)
export default ChromaFlow
