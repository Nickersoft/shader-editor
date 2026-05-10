import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  refraction: zFloat(0, 1, 0.01).default(0.5).describe('Refraction'),
  chromaticAberration: zFloat(0, 1, 0.01).default(0.3).describe('Chromatic Aberration'),
  blur: zFloat(0, 1, 0.01).default(0.2).describe('Blur'),
  tint: zColor().default([1.0, 1.0, 1.0]).describe('Tint'),
  tintIntensity: zFloat(0, 1, 0.01).default(0.2).describe('Tint Intensity'),
  fresnel: zFloat(0, 1, 0.01).default(0.3).describe('Fresnel'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glass',
  description: 'Frosted-glass refraction',
  color: '#22d3ee',
  category: 'shape-effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Glass extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glass'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly appliesTo = ['shape'] as const

  glsl(): GlslBlock {
    const refraction = this.uniformName('refraction')
    const ca = this.uniformName('chromaticAberration')
    const blur = this.uniformName('blur')
    const tint = this.uniformName('tint')
    const tintI = this.uniformName('tintIntensity')
    const fresnel = this.uniformName('fresnel')
    return {
      dependencies: ['simplex2D', 'gaussian9'],
      main: `
vec2 q = uv * 8.0;
float e = 0.01;
float n  = simplex2D(q);
float nx = simplex2D(q + vec2(e, 0.0));
float ny = simplex2D(q + vec2(0.0, e));
vec2 grad = vec2(nx - n, ny - n) / e;
vec2 refractedUV = uv + grad * ${refraction} * 0.04;
float caStrength = ${ca} * 0.015;
vec2 caDir = normalize(grad + vec2(1e-5));
vec2 texel = 1.0 / u_resolution;
vec2 br = texel * ${blur} * 6.0;
vec4 sR = gaussian9(u_prevPass, refractedUV + caDir * caStrength, br);
vec4 sG = gaussian9(u_prevPass, refractedUV, br);
vec4 sB = gaussian9(u_prevPass, refractedUV - caDir * caStrength, br);
vec3 col = vec3(sR.r, sG.g, sB.b);
col = mix(col, col * ${tint}, ${tintI});
float rim = clamp(length(grad) * 0.5, 0.0, 1.0);
col += rim * ${fresnel};
return vec4(col, sG.a);`,
    }
  }
}

register(Glass)
export default Glass
