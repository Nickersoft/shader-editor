import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0.808, 0.106, 0.918]).describe('Color A (shadows)'),
  colorB: zColor().default([0.184, 1.0, 0.0]).describe('Color B (midtones)'),
  colorC: zColor().default([1.0, 1.0, 0.0]).describe('Color C (highlights)'),
  blendMid: zFloat(0, 1).default(0.5).describe('Midpoint'),
  softness: zFloat(0, 1).default(0.25).describe('Softness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Tritone',
  description: 'Map colors to three tones: shadows, midtones, highlights',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Tritone extends EffectNode<Config, Inputs> {
  static readonly typeId = 'tritone'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const colorC = this.uniformName('colorC')
    const blendMid = this.uniformName('blendMid')
    const softness = this.uniformName('softness')
    return {
      main: `
base = texture(u_prevPass, uv);
float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
float w = ${softness};
float shadowToMid = smoothstep(${blendMid} - w, ${blendMid}, lum);
vec3 lower = mix(${colorA}, ${colorB}, shadowToMid);
float midToHi = smoothstep(${blendMid}, ${blendMid} + w, lum);
vec3 upper = mix(${colorB}, ${colorC}, midToHi);
float blend = smoothstep(${blendMid} - w * 0.4, ${blendMid} + w * 0.4, lum);
return vec4(mix(lower, upper, blend), base.a);`,
    }
  }
}

register(Tritone)
export default Tritone
