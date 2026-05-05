import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1.0, 0.9, 0.7]).describe('Color'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  glowSize: zFloat(0.01, 1).default(0.15).describe('Glow Size'),
  streakLength: zFloat(0, 2).default(0.6).describe('Streak Length'),
  intensity: zFloat(0, 3).default(0.8).describe('Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Lens Flare',
  description: 'Bright central glow with horizontal streak',
  color: '#fde047',
  category: 'overlays',
  defaultBlendMode: 'add',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LensFlare extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'lens-flare'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const glowSize = this.uniformName('glowSize')
    const streakLength = this.uniformName('streakLength')
    const intensity = this.uniformName('intensity')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float r = length(p);
float glow = exp(-r * r / max(${glowSize} * ${glowSize}, 1e-4));
float streak = exp(-abs(p.y) * 60.0) * exp(-abs(p.x) / max(${streakLength}, 1e-4));
float v = (glow + streak * 0.7) * ${intensity};
return vec4(${color} * v, v);`,
    }
  }
}

register(LensFlare)
export default LensFlare
