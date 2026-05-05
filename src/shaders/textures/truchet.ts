import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(1, 60, 0.5).default(12.0).describe('Scale'),
  lineWidth: zFloat(0.001, 0.5, 0.001).default(0.12).describe('Line Width'),
  seed: zFloat(0, 100, 1).default(0).describe('Seed'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Truchet',
  description: 'Random quarter-arc tiling',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Truchet extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'truchet'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const scale = this.uniformName('scale')
    const lineWidth = this.uniformName('lineWidth')
    const seed = this.uniformName('seed')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep', 'hash'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale};
vec2 cell = floor(q);
vec2 f = fract(q);
float h = hash(cell + ${seed});
if (h < 0.5) f = vec2(f.x, 1.0 - f.y);
float d = abs(length(f) - 0.5);
float d2 = abs(length(f - vec2(1.0)) - 0.5);
float dd = min(d, d2);
float m = 1.0 - aastep(${lineWidth} * 0.5, dd);
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(Truchet)
export default Truchet
