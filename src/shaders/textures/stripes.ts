import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0, 0, 0]).describe('Color A'),
  colorB: zColor().default([1, 1, 1]).describe('Color B'),
  angle: zAngle().default(45).describe('Angle'),
  density: zFloat(0.5, 60, 0.5).default(5).describe('Density'),
  balance: zFloat(0, 1).default(0.5).describe('Balance'),
  softness: zFloat(0, 1).default(0).describe('Softness'),
  speed: zFloat(-4, 4, 0.05).default(0.2).describe('Speed'),
  offset: zFloat(0, 1).default(0).describe('Offset'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Stripes',
  description: 'Alternating colored stripes with animation',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Stripes extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'stripes'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const angle = this.uniformName('angle')
    const density = this.uniformName('density')
    const balance = this.uniformName('balance')
    const softness = this.uniformName('softness')
    const speed = this.uniformName('speed')
    const offset = this.uniformName('offset')
    return {
      dependencies: ['aastep', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, ${angle} * 3.14159 / 180.0);
float t = fract(p.x * ${density} + ${offset} + u_time * ${speed} * 0.2);
float bal = clamp(${balance}, 0.001, 0.999);
float soft = clamp(${softness}, 0.0, 1.0) * 0.49 + 0.001;
float m = smoothstep(bal - soft, bal + soft, t);
vec3 col = mix(${colorB}, ${colorA}, m);
return vec4(col, 1.0);`,
    }
  }
}

register(Stripes)
export default Stripes
