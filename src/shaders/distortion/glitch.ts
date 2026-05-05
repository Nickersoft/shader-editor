import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.3, 0.005).default(0.04).describe('Amount'),
  lines: zFloat(4, 400, 1).default(80.0).describe('Bands'),
  chroma: zFloat(0, 0.05, 0.001).default(0.005).describe('Chroma Shift'),
  speed: zFloat(0, 30, 0.1).default(6.0).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glitch',
  description: 'Banded horizontal jitter with chroma shift',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Glitch extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glitch'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const lines = this.uniformName('lines')
    const chroma = this.uniformName('chroma')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash'],
      main: `
float band = floor(uv.y * ${lines});
float t = floor(u_time * ${speed});
float jitter = (hash(vec2(band, t)) - 0.5) * 2.0 * ${amount};
vec2 q = vec2(uv.x + jitter, uv.y);
float r = texture(u_prevPass, q + vec2(${chroma}, 0.0)).r;
float g = texture(u_prevPass, q).g;
float b = texture(u_prevPass, q - vec2(${chroma}, 0.0)).b;
return vec4(r, g, b, 1.0);`,
    }
  }
}

register(Glitch)
export default Glitch
