import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'

const config = z.object({})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Luminance Tap',
  description: 'Replace previous pass with its luminance',
  color: '#f59e0b',
  category: 'effects',
  defaultBlendMode: 'normal',
  outputKind: 'scalar',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LuminanceTap extends EffectNode<Config, Inputs> {
  static readonly typeId = 'luminance-tap'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    return {
      dependencies: ['luma'],
      main: `
float lum = luma(texture(u_prevPass, uv).rgb);
return vec4(lum, lum, lum, 1.0);`,
    }
  }
}

register(LuminanceTap)
export default LuminanceTap
