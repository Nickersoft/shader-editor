import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  cells: zFloat(4, 400, 1).default(60).describe('Cells'),
  angle: zFloat(0, 90, 1).default(30).describe('Angle'),
  softness: zFloat(0.001, 0.4, 0.001).default(0.05).describe('Softness'),
  colorBack: zColor().default([1, 1, 1]).describe('Background'),
  colorDot: zColor().default([0, 0, 0]).describe('Dot'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Halftone',
  description: 'Print-style dot screen sized by luminance',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Halftone extends EffectNode<Config, Inputs> {
  static readonly typeId = 'halftone'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cells = this.uniformName('cells')
    const angle = this.uniformName('angle')
    const softness = this.uniformName('softness')
    const colorBack = this.uniformName('colorBack')
    const colorDot = this.uniformName('colorDot')
    return {
      dependencies: ['rotate2D', 'luma'],
      main: `
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0) + 0.5;
vec2 cellUv = fract(q * vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)))) - 0.5;
float lum = luma(texture(u_prevPass, uv).rgb);
float radius = (1.0 - lum) * 0.5;
float d = length(cellUv);
float fillDot = 1.0 - smoothstep(radius - ${softness}, radius + ${softness}, d);
return vec4(mix(${colorBack}, ${colorDot}, fillDot), 1.0);`,
    }
  }
}

register(Halftone)
export default Halftone
