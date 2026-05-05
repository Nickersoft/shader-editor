import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  count: zFloat(4, 200, 1).default(40.0).describe('Count'),
  speed: zFloat(0, 8, 0.05).default(1.0).describe('Speed'),
  lengthMin: zFloat(0.05, 1).default(0.2).describe('Min Length'),
  lengthMax: zFloat(0.05, 1).default(0.7).describe('Max Length'),
  thickness: zFloat(0.01, 1).default(0.3).describe('Thickness'),
  color1: zColor().default([0.05, 0.05, 0.05]).describe('Color 1'),
  color2: zColor().default([0.95, 0.95, 0.95]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Falling Lines',
  description: 'Animated downward streaks',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FallingLines extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'falling-lines'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const count = this.uniformName('count')
    const speed = this.uniformName('speed')
    const lengthMin = this.uniformName('lengthMin')
    const lengthMax = this.uniformName('lengthMax')
    const thickness = this.uniformName('thickness')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['aastep', 'hash'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float n = ${count};
vec2 q = vec2(p.x * n, p.y);
float col = floor(q.x);
float seed = hash(vec2(col, 1.0));
float speedJ = mix(0.5, 1.5, hash(vec2(col, 2.0)));
float len = mix(${lengthMin}, ${lengthMax}, hash(vec2(col, 3.0)));
float yOff = -u_time * ${speed} * speedJ + seed * 4.0;
float yLocal = fract(p.y + yOff);
float lineMask = smoothstep(0.0, 0.05, yLocal) * (1.0 - smoothstep(len, len + 0.05, yLocal));
float xLocal = fract(q.x) - 0.5;
float xMask = 1.0 - aastep(${thickness} * 0.5, abs(xLocal));
float m = xMask * lineMask;
return vec4(mix(${color1}, ${color2}, m), 1.0);`,
    }
  }
}

register(FallingLines)
export default FallingLines
