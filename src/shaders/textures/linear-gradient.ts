import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(10)
    .default({
      values: [
        [0.05, 0.05, 0.1, 1],
        [0.2, 0.4, 0.8, 1],
      ],
      length: 2,
    } satisfies Palette)
    .describe('Colors'),
  angle: zAngle().default(0).describe('Angle'),
  offset: zFloat(0, 1).default(0.5).describe('Offset'),
  smoothness: zFloat(0.01, 2).default(1.0).describe('Smoothness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Linear Gradient',
  description: 'Smooth linear gradient with N color stops',
  color: '#f97316',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LinearGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'linear-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const angle = this.uniformName('angle')
    const offset = this.uniformName('offset')
    const smoothness = this.uniformName('smoothness')
    return {
      dependencies: ['rotate2D', 'colorRampLookup'],
      main: `
vec2 gradUv = uv - 0.5;
gradUv = rotate2D(gradUv, ${angle} * 3.14159 / 180.0);
float t = gradUv.y + 0.5;
t = (t - (1.0 - ${offset})) / max(${smoothness}, 1e-4);
t = clamp(t, 0.0, 1.0);
return colorRampLookup(t, ${colors}, ${colors}_count, 0, 1.0, 1, false);`,
    }
  }
}

register(LinearGradient)
export default LinearGradient
