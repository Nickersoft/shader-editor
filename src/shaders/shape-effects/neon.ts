import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  glowIntensity: zFloat(0, 2, 0.05).default(1.0).describe('Glow Intensity'),
  glowSize: zFloat(0, 1, 0.01).default(0.3).describe('Glow Size'),
  flicker: zFloat(0, 1, 0.01).default(0).describe('Flicker'),
  coreColor: zColor().default([1.0, 1.0, 1.0]).describe('Core Color'),
  glowColor: zColor().default([1.0, 0.6, 0.2]).describe('Glow Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Neon',
  description: 'Glowing-edges neon effect',
  color: '#facc15',
  category: 'shape-effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Neon extends EffectNode<Config, Inputs> {
  static readonly typeId = 'neon'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly appliesTo = ['shape'] as const

  glsl(): GlslBlock {
    const glowIntensity = this.uniformName('glowIntensity')
    const glowSize = this.uniformName('glowSize')
    const flicker = this.uniformName('flicker')
    const coreColor = this.uniformName('coreColor')
    const glowColor = this.uniformName('glowColor')
    return {
      dependencies: ['luma', 'gaussian13'],
      main: `
vec2 texel = 1.0 / u_resolution;
float lc = luma(texture(u_prevPass, uv).rgb);
float l1 = luma(texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb);
float l2 = luma(texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb);
float l3 = luma(texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb);
float l4 = luma(texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb);
float edge = clamp(abs(l1 - l2) + abs(l3 - l4), 0.0, 1.0);
vec2 g = texel * ${glowSize} * 30.0;
vec4 blurH = gaussian13(u_prevPass, uv, vec2(g.x, 0.0));
vec4 blurV = gaussian13(u_prevPass, uv, vec2(0.0, g.y));
float blurEdge = (luma(blurH.rgb) + luma(blurV.rgb)) * 0.5;
float flick = 1.0 - ${flicker} * (0.5 + 0.5 * sin(u_time * 20.0));
vec3 core = ${coreColor} * edge * 4.0;
vec3 halo = ${glowColor} * blurEdge * 1.5;
vec3 col = (core + halo) * ${glowIntensity} * flick;
return vec4(col, 1.0);`,
    }
  }
}

register(Neon)
export default Neon
