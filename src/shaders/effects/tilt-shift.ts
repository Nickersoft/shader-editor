import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  focusY: zFloat(0, 1).default(0.5).describe('Focus Y'),
  focusWidth: zFloat(0.01, 0.8).default(0.2).describe('Focus Width'),
  blur: zFloat(0, 30, 0.5).default(6).describe('Max Blur'),
  angle: zFloat(-45, 45, 1).default(0).describe('Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Tilt Shift',
  description: 'Selective focus band (tilt-shift miniature)',
  color: '#0ea5e9',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class TiltShift extends EffectNode<Config, Inputs> {
  static readonly typeId = 'tilt-shift'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const focusY = this.uniformName('focusY')
    const focusWidth = this.uniformName('focusWidth')
    const blur = this.uniformName('blur')
    const angle = this.uniformName('angle')
    return {
      dependencies: ['rotate2D', 'gaussian9'],
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0);
float d = abs(q.y - (${focusY} - 0.5));
float t = smoothstep(${focusWidth} * 0.5, ${focusWidth} * 0.5 + 0.4, d);
return gaussian9(u_prevPass, uv, texel * ${blur} * t);`,
    }
  }
}

register(TiltShift)
export default TiltShift
