import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  redIntensity: zFloat(0, 100, 1).default(0).describe('Red Intensity'),
  greenIntensity: zFloat(0, 100, 1).default(0).describe('Green Intensity'),
  blueIntensity: zFloat(0, 100, 1).default(0).describe('Blue Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Channel Blur',
  description: 'Independent blur for red, green, and blue channels',
  color: '#94a3b8',
  category: 'blurs',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ChannelBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'channel-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock[] {
    const r = this.uniformName('redIntensity')
    const g = this.uniformName('greenIntensity')
    const b = this.uniformName('blueIntensity')
    const deps = ['gaussian13']
    return [
      {
        dependencies: deps,
        main: `
vec2 texel = 1.0 / u_resolution;
vec4 rH = gaussian13(u_prevPass, uv, vec2(texel.x * ${r} * 0.36, 0.0));
vec4 gH = gaussian13(u_prevPass, uv, vec2(texel.x * ${g} * 0.36, 0.0));
vec4 bH = gaussian13(u_prevPass, uv, vec2(texel.x * ${b} * 0.36, 0.0));
return vec4(rH.r, gH.g, bH.b, texture(u_prevPass, uv).a);`,
      },
      {
        dependencies: deps,
        main: `
vec2 texel = 1.0 / u_resolution;
vec4 rV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${r} * 0.36));
vec4 gV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${g} * 0.36));
vec4 bV = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * ${b} * 0.36));
return vec4(rV.r, gV.g, bV.b, texture(u_prevPass, uv).a);`,
      },
    ]
  }
}

register(ChannelBlur)
export default ChannelBlur
