import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  lightAngle: zAngle().default(45).describe('Light Angle'),
  intensity: zFloat(0, 1, 0.01).default(0.5).describe('Intensity'),
  softness: zFloat(0, 1, 0.01).default(0.5).describe('Softness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Emboss',
  description: 'Embossed relief',
  color: '#475569',
  category: 'shape-effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Emboss extends EffectNode<Config, Inputs> {
  static readonly typeId = 'emboss'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const angle = this.uniformName('lightAngle')
    const intensity = this.uniformName('intensity')
    const softness = this.uniformName('softness')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution;
float a = ${angle} * 3.14159 / 180.0;
float reach = mix(1.0, 4.0, ${softness});
vec2 dir = vec2(cos(a), sin(a)) * texel * reach;
float l1 = luma(texture(u_prevPass, uv + dir).rgb);
float l2 = luma(texture(u_prevPass, uv - dir).rgb);
float v = (l1 - l2) * ${intensity} * 4.0 + 0.5;
return vec4(vec3(v), 1.0);`,
    }
  }
}

register(Emboss)
export default Emboss
