import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenterAxis, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  radius: zFloat(0, 2, 0.01).default(0.7).describe('Radius'),
  falloff: zFloat(0, 1).default(0.3).describe('Falloff'),
  intensity: zFloat(0, 1).default(0.5).describe('Intensity'),
  color: zColor().default([0, 0, 0]).describe('Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Vignette',
  description: 'Off-center radial darkening with configurable falloff',
  color: '#475569',
  category: 'stylize',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Vignette extends EffectNode<Config, Inputs> {
  static readonly typeId = 'vignette'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const centerX = this.uniformName('centerX')
    const centerY = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const falloff = this.uniformName('falloff')
    const intensity = this.uniformName('intensity')
    const color = this.uniformName('color')
    return {
      main: `
base = texture(u_prevPass, uv);
vec2 ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 d = (uv - vec2(${centerX}, ${centerY})) * ar;
float r = length(d);
float v = smoothstep(${radius}, ${radius} + max(${falloff}, 1e-4), r) * ${intensity};
return vec4(mix(base.rgb, ${color}, v), base.a);`,
    }
  }
}

register(Vignette)
export default Vignette
