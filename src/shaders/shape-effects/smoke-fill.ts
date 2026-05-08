import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1).default(0.5).describe('Intensity'),
  speed: zFloat(0, 2, 0.05).default(0.3).describe('Speed'),
  scale: zFloat(0.1, 5, 0.05).default(2.0).describe('Scale'),
  color1: zColor().default([0.55, 0.95, 1.0]).describe('Color 1'),
  color2: zColor().default([0.02, 0.63, 0.84]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Smoke Fill',
  description: 'Fill an alpha mask with billowing smoke',
  color: '#94a3b8',
  category: 'shape-effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SmokeFill extends EffectNode<Config, Inputs> {
  static readonly typeId = 'smoke-fill'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const speed = this.uniformName('speed')
    const scale = this.uniformName('scale')
    const c1 = this.uniformName('color1')
    const c2 = this.uniformName('color2')
    return {
      dependencies: ['fbm', 'simplex2D'],
      main: `
float n = fbm(uv * ${scale} + u_time * vec2(0.0, ${speed} * 0.1), 4.0, 2.0, 0.5) * 0.5 + 0.5;
vec3 smoke = mix(${c1}, ${c2}, n);
return vec4(mix(base.rgb, smoke, base.a * ${intensity} * n), base.a);`,
    }
  }
}

register(SmokeFill)
export default SmokeFill
