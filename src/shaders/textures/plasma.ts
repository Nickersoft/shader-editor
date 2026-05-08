import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0.44, 0.09, 0.75]).describe('Color A'),
  colorB: zColor().default([0, 0, 0]).describe('Color B'),
  density: zFloat(0.1, 12, 0.05).default(2).describe('Density'),
  speed: zFloat(0, 8, 0.05).default(2).describe('Speed'),
  intensity: zFloat(0, 4, 0.01).default(1.5).describe('Intensity'),
  warp: zFloat(0, 2, 0.01).default(0.4).describe('Warp'),
  contrast: zFloat(0, 4, 0.01).default(1).describe('Contrast'),
  balance: zFloat(0, 100, 1).default(50).describe('Balance'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Plasma',
  description: 'Animated effect of glowing plasma',
  color: '#ec4899',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Plasma extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'plasma'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const density = this.uniformName('density')
    const speed = this.uniformName('speed')
    const intensity = this.uniformName('intensity')
    const warp = this.uniformName('warp')
    const contrast = this.uniformName('contrast')
    const balance = this.uniformName('balance')
    return {
      dependencies: ['fbm', 'simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed} * 0.25;
vec2 q = p * ${density};
q += ${warp} * vec2(fbm(q + t, 4.0, 2.0, 0.5), fbm(q - t * 0.7, 4.0, 2.0, 0.5));
float v = sin(q.x + t) + sin(q.y * 0.7 + t * 1.3) + sin((q.x + q.y) * 0.6 + t * 0.9);
v += sin(length(q) - t);
v *= 0.25 * ${intensity};
float k = clamp(0.5 + 0.5 * v, 0.0, 1.0);
k = clamp((k - 0.5) * ${contrast} + 0.5 + (${balance} / 100.0 - 0.5) * 0.6, 0.0, 1.0);
vec3 col = mix(${colorB}, ${colorA}, k);
return vec4(col, 1.0);`,
    }
  }
}

register(Plasma)
export default Plasma
