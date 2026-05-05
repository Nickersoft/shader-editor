import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1.0, 0.9, 0.6]).describe('Color'),
  centerX: zFloat(-0.5, 1.5).default(0.5).describe('Center X'),
  centerY: zFloat(-0.5, 1.5).default(0.5).describe('Center Y'),
  density: zFloat(1, 200, 1).default(30.0).describe('Density'),
  intensity: zFloat(0, 3).default(0.6).describe('Intensity'),
  falloff: zFloat(0.1, 5, 0.05).default(1.5).describe('Falloff'),
  speed: zFloat(0, 4, 0.05).default(0.2).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'God Rays',
  description: 'Radial light rays from a focal point',
  color: '#facc15',
  category: 'overlays',
  defaultBlendMode: 'add',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class GodRays extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'god-rays'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const density = this.uniformName('density')
    const intensity = this.uniformName('intensity')
    const falloff = this.uniformName('falloff')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float r = length(p);
float a = atan(p.y, p.x);
float n = simplex2D(vec2(a * ${density}, u_time * ${speed})) * 0.5 + 0.5;
float ray = pow(n, 4.0);
float f = exp(-r * ${falloff}) * ${intensity};
float v = ray * f;
return vec4(${color} * v, v);`,
    }
  }
}

register(GodRays)
export default GodRays
