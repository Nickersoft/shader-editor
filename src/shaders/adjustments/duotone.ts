import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([1.0, 0.0, 0.0]).describe('Color A (shadows)'),
  colorB: zColor().default([0.008, 0.227, 0.957]).describe('Color B (highlights)'),
  blend: zFloat(0, 1).default(0.5).describe('Blend'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Duotone',
  description: 'Map colors to two tones based on luminance',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Duotone extends EffectNode<Config, Inputs> {
  static readonly typeId = 'duotone'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const blend = this.uniformName('blend')
    return {
      main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
float t = smoothstep(${blend} - 0.5, ${blend} + 0.5, lum);
return vec4(mix(${colorA}, ${colorB}, t), base.a);`,
    }
  }
}

register(Duotone)
export default Duotone
