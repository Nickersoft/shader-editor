import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(1, 60, 0.5).default(14.0).describe('Scale'),
  lineWidth: zFloat(0.001, 0.5, 0.001).default(0.06).describe('Line Width'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Hex Grid',
  description: 'Hexagonal grid pattern',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class HexGrid extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'hex-grid'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const scale = this.uniformName('scale')
    const lineWidth = this.uniformName('lineWidth')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale};
const vec2 h = vec2(1.0, 1.7320508);
vec2 a = mod(q, h) - h * 0.5;
vec2 b = mod(q - h * 0.5, h) - h * 0.5;
vec2 g = (dot(a, a) < dot(b, b)) ? a : b;
float dist = max(abs(g.x) * 0.866 + g.y * 0.5, abs(g.y));
float m = 1.0 - aastep(0.5 - ${lineWidth}, dist);
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(HexGrid)
export default HexGrid
