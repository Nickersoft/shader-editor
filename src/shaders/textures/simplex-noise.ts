import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(0.1, 20, 0.1).default(3.0).describe('Scale'),
  speed: zFloat(0, 5, 0.1).default(1.0).describe('Speed'),
  octaves: zFloat(1, 8, 1).default(4.0).describe('Octaves'),
  lacunarity: zFloat(1, 4, 0.1).default(2.0).describe('Lacunarity'),
  gain: zFloat(0, 1).default(0.5).describe('Gain'),
  color1: zColor().default([0.0, 0.0, 0.0]).describe('Color 1'),
  color2: zColor().default([1.0, 1.0, 1.0]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Simplex Noise',
  description: 'Smooth, organic noise pattern',
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
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    const octaves = this.uniformName('octaves')
    const lacunarity = this.uniformName('lacunarity')
    const gain = this.uniformName('gain')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['simplex2D', 'fbm'],
      main: `
vec2 noiseUv = uv * ${scale} + u_time * ${speed} * 0.1;
float n = fbm(noiseUv, ${octaves}, ${lacunarity}, ${gain});
n = n * 0.5 + 0.5;
vec3 col = mix(${color1}, ${color2}, n);
return vec4(col, 1.0);`,
    }
  }
}

register(SimplexNoise)
export default SimplexNoise
