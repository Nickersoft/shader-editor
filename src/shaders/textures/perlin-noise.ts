import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.05, 0.05, 0.1]).describe('Color 1'),
  color2: zColor().default([0.85, 0.95, 1.0]).describe('Color 2'),
  scale: zFloat(0.1, 30, 0.1).default(3.0).describe('Scale'),
  octaves: zFloat(1, 8, 1).default(5.0).describe('Octaves'),
  persistence: zFloat(0.1, 1).default(0.5).describe('Persistence'),
  lacunarity: zFloat(1.1, 4, 0.1).default(2.0).describe('Lacunarity'),
  speed: zFloat(0, 4, 0.05).default(0.4).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Perlin Noise',
  description: 'Animated FBM noise mapped to two colours',
  color: '#8b5cf6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class PerlinNoise extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'perlin-noise'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const scale = this.uniformName('scale')
    const octaves = this.uniformName('octaves')
    const persistence = this.uniformName('persistence')
    const lacunarity = this.uniformName('lacunarity')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale} + u_time * ${speed} * 0.3;
float sum = 0.0;
float amp = 1.0;
float freq = 1.0;
float maxAmp = 0.0;
for (int i = 0; i < 8; i++) {
  if (float(i) >= ${octaves}) break;
  sum += simplex2D(q * freq) * amp;
  maxAmp += amp;
  amp *= ${persistence};
  freq *= ${lacunarity};
}
float n = (sum / max(maxAmp, 1e-4)) * 0.5 + 0.5;
return vec4(mix(${color1}, ${color2}, n), 1.0);`,
    }
  }
}

register(PerlinNoise)
export default PerlinNoise
