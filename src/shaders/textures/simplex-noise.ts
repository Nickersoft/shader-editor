import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([1, 1, 1]).describe('Color A'),
  colorB: zColor().default([0, 0, 0]).describe('Color B'),
  scale: zFloat(0.1, 20, 0.1).default(2).describe('Scale'),
  balance: zFloat(-1, 1).default(0).describe('Balance'),
  contrast: zFloat(-1, 4, 0.05).default(0).describe('Contrast'),
  seed: zFloat(0, 100, 0.1).default(0).describe('Seed'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Simplex Noise',
  description: 'Organic noise with animated movement',
  color: '#8b5cf6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SimplexNoise extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'simplex-noise'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const scale = this.uniformName('scale')
    const balance = this.uniformName('balance')
    const contrast = this.uniformName('contrast')
    const seed = this.uniformName('seed')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D', 'fbm'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar * ${scale} + ${seed};
float t = u_time * ${speed} * 0.15;
float n = fbm(p + t, 5.0, 2.0, 0.5);
n = n * 0.5 + 0.5;
n = clamp(n + ${balance} * 0.5, 0.0, 1.0);
float c = clamp(${contrast} + 1.0, 0.0, 5.0);
n = clamp((n - 0.5) * c + 0.5, 0.0, 1.0);
vec3 col = mix(${colorB}, ${colorA}, n);
return vec4(col, 1.0);`,
    }
  }
}

register(SimplexNoise)
export default SimplexNoise
