import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0, 0, 0]).describe('Color A'),
  colorB: zColor().default([1, 1, 1]).describe('Color B'),
  cells: zInt(2, 80).default(10).describe('Cells'),
  thickness: zFloat(0, 8, 0.1).default(2).describe('Thickness'),
  seed: zFloat(0, 100, 1).default(0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Truchet',
  description: 'Quarter-circle arc tiles forming organic, maze-like flowing curves',
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
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const cells = this.uniformName('cells')
    const thickness = this.uniformName('thickness')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['aastep', 'hash'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * float(${cells});
vec2 cell = floor(q);
vec2 f = fract(q);
float h = hash(cell + ${seed});
if (h < 0.5) f = vec2(f.x, 1.0 - f.y);
float d = abs(length(f) - 0.5);
float d2 = abs(length(f - vec2(1.0)) - 0.5);
float dd = min(d, d2);
float lw = clamp(${thickness}, 0.0, 8.0) * 0.025;
float arc = 1.0 - aastep(lw, dd);
vec3 col = mix(${colorA}, ${colorB}, arc);
return vec4(col, 1.0);`,
    }
  }
}

register(Truchet)
export default Truchet
