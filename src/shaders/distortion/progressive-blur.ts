import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  maxAmount: zFloat(0, 30, 0.5).default(6.0).describe('Max Amount'),
  angle: zAngle().default(90.0).describe('Direction'),
  midPoint: zFloat(0, 1).default(0.5).describe('Mid Point'),
  falloff: zFloat(0.1, 4, 0.05).default(1.0).describe('Falloff'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Progressive Blur',
  description: 'Blur strength ramps along an axis',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ProgressiveBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'progressive-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const maxAmount = this.uniformName('maxAmount')
    const angle = this.uniformName('angle')
    const midPoint = this.uniformName('midPoint')
    const falloff = this.uniformName('falloff')
    return {
      dependencies: ['rotate2D', 'gaussian9'],
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 q = rotate2D(uv - 0.5, -${angle} * 3.14159 / 180.0) + 0.5;
float t = smoothstep(${midPoint} - 0.5 / max(${falloff}, 0.001), ${midPoint} + 0.5 / max(${falloff}, 0.001), q.y);
return gaussian9(u_prevPass, uv, texel * ${maxAmount} * t);`,
    }
  }
}

register(ProgressiveBlur)
export default ProgressiveBlur
