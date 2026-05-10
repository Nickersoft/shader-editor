import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 200, 1).default(50).describe('Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Blur',
  description: 'Symmetric Gaussian blur',
  color: '#94a3b8',
  category: 'blurs',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Blur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock[] {
    const intensity = this.uniformName('intensity')
    const deps = ['gaussian13'] as const
    return [
      {
        dependencies: deps,
        main: `
vec2 texel = 1.0 / u_resolution;
float r = ${intensity} * 0.36;
return gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));`,
      },
      {
        dependencies: deps,
        main: `
vec2 texel = 1.0 / u_resolution;
float r = ${intensity} * 0.36;
return gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));`,
      },
    ]
  }
}

register(Blur)
export default Blur
