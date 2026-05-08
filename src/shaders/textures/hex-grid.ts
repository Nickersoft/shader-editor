import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0, 0, 0]).describe('Color A'),
  colorB: zColor().default([1, 1, 1]).describe('Color B'),
  cells: zInt(1, 80).default(8).describe('Cells'),
  thickness: zFloat(0, 4, 0.05).default(1).describe('Thickness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Hex Grid',
  description: 'Honeycomb hexagonal grid pattern',
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
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const cells = this.uniformName('cells')
    const thickness = this.uniformName('thickness')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * float(${cells});
const vec2 h = vec2(1.0, 1.7320508);
vec2 a = mod(q, h) - h * 0.5;
vec2 b = mod(q - h * 0.5, h) - h * 0.5;
vec2 g = (dot(a, a) < dot(b, b)) ? a : b;
g = abs(g);
float dist = max(g.x, g.x * 0.5 + g.y * 0.866025);
float lw = clamp(${thickness}, 0.0, 4.0) * 0.025;
float line = 1.0 - aastep(0.5 - lw, dist);
vec3 col = mix(${colorA}, ${colorB}, line);
return vec4(col, 1.0);`,
    }
  }
}

register(HexGrid)
export default HexGrid
