import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  scale: zFloat(1, 60, 0.5).default(14.0).describe('Scale'),
  thickness: zFloat(0.05, 0.95).default(0.4).describe('Thickness'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Weave',
  description: 'Interlaced over/under stripes',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Weave extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'weave'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const scale = this.uniformName('scale')
    const thickness = this.uniformName('thickness')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale};
vec2 cell = floor(q);
vec2 f = fract(q) - 0.5;
bool over = mod(cell.x + cell.y, 2.0) < 0.5;
float horiz = 1.0 - aastep(${thickness} * 0.5, abs(f.y));
float vert = 1.0 - aastep(${thickness} * 0.5, abs(f.x));
float m = over ? max(horiz, vert * 0.5) : max(vert, horiz * 0.5);
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(Weave)
export default Weave
