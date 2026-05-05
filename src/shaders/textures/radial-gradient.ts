import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(10)
    .default({
      values: [
        [1.0, 0.8, 0.4, 1],
        [0.1, 0.05, 0.2, 1],
      ],
      length: 2,
    } satisfies Palette)
    .describe('Colors'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  radius: zFloat(0.05, 2).default(0.8).describe('Radius'),
  falloff: zFloat(0.2, 4).default(1.0).describe('Falloff'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Radial Gradient',
  description: 'Circular gradient with N color stops radiating from center',
  color: '#ec4899',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class RadialGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'radial-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const falloff = this.uniformName('falloff')
    return {
      dependencies: ['colorRampLookup'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float t = clamp(pow(length(p) / max(${radius}, 1e-4), ${falloff}), 0.0, 1.0);
return colorRampLookup(t, ${colors}, ${colors}_count, 0, 1.0, 1, false);`,
    }
  }
}

register(RadialGradient)
export default RadialGradient
