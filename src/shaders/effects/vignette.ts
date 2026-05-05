import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 2).default(0.6).describe('Amount'),
  radius: zFloat(0.1, 1.5).default(0.5).describe('Radius'),
  softness: zFloat(0.01, 1.5).default(0.5).describe('Softness'),
  roundness: zFloat(0.1, 4, 0.05).default(1).describe('Roundness'),
  color: zColor().default([0, 0, 0]).describe('Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Vignette',
  description: 'Darkened edges with adjustable radius, softness, and shape',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Vignette extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'vignette'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const radius = this.uniformName('radius')
    const softness = this.uniformName('softness')
    const roundness = this.uniformName('roundness')
    const color = this.uniformName('color')
    return {
      main: `
vec2 q = (uv - 0.5) * vec2(pow(u_resolution.x / max(u_resolution.y, 1.0), 1.0 / max(${roundness}, 0.001)), 1.0);
float r = length(q);
float v = smoothstep(${radius}, ${radius} + ${softness}, r) * ${amount};
return vec4(mix(base.rgb, ${color}, v), base.a);`,
    }
  }
}

register(Vignette)
export default Vignette
