import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  redOffsetX: zFloat(-0.05, 0.05, 0.001).default(0.005).describe('Red X'),
  redOffsetY: zFloat(-0.05, 0.05, 0.001).default(0).describe('Red Y'),
  greenOffsetX: zFloat(-0.05, 0.05, 0.001).default(0).describe('Green X'),
  greenOffsetY: zFloat(-0.05, 0.05, 0.001).default(0).describe('Green Y'),
  blueOffsetX: zFloat(-0.05, 0.05, 0.001).default(-0.005).describe('Blue X'),
  blueOffsetY: zFloat(-0.05, 0.05, 0.001).default(0).describe('Blue Y'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Chromatic Aberration',
  description: 'True separable RGB-channel offset',
  color: '#ef4444',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ChromaticAberration extends EffectNode<Config, Inputs> {
  static readonly typeId = 'chromatic-aberration'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const rx = this.uniformName('redOffsetX')
    const ry = this.uniformName('redOffsetY')
    const gx = this.uniformName('greenOffsetX')
    const gy = this.uniformName('greenOffsetY')
    const bx = this.uniformName('blueOffsetX')
    const by = this.uniformName('blueOffsetY')
    return {
      main: `
float r = texture(u_prevPass, uv + vec2(${rx}, ${ry})).r;
float g = texture(u_prevPass, uv + vec2(${gx}, ${gy})).g;
float b = texture(u_prevPass, uv + vec2(${bx}, ${by})).b;
return vec4(r, g, b, 1.0);`,
    }
  }
}

register(ChromaticAberration)
export default ChromaticAberration
