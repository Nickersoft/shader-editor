import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0.07, 0.46, 0.85]).describe('Color A'),
  colorB: zColor().default([0.88, 0.57, 0.21]).describe('Color B'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
  detail: zFloat(0.1, 4, 0.05).default(1).describe('Detail'),
  blend: zFloat(0, 100, 1).default(50).describe('Blend'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Swirl',
  description: 'Flowing swirl pattern with multi-layered noise',
  color: '#22d3ee',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Swirl extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'swirl'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const speed = this.uniformName('speed')
    const detail = this.uniformName('detail')
    const blend = this.uniformName('blend')
    return {
      dependencies: ['fbm', 'simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar * mix(1.0, 3.0, ${detail} * 0.5);
float t = u_time * ${speed} * 0.2;
vec2 q = p + vec2(fbm(p + vec2(t, 0.0), 4.0, 2.0, 0.5), fbm(p + vec2(0.0, t), 4.0, 2.0, 0.5));
vec2 r = p + vec2(fbm(q * 1.6 + t * 1.3, 4.0, 2.0, 0.5), fbm(q * 1.6 - t * 1.1, 4.0, 2.0, 0.5));
float n = fbm(r * 1.4 + t, 5.0, 2.0, 0.5);
float k = clamp(0.5 + 0.5 * n + (${blend} / 100.0 - 0.5) * 0.6, 0.0, 1.0);
vec3 col = mix(${colorA}, ${colorB}, k);
return vec4(col, 1.0);`,
    }
  }
}

register(Swirl)
export default Swirl
