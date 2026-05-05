import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  threshold: zFloat(0, 1).default(0.5).describe('Threshold'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Solarize',
  description: 'Invert tones above a threshold',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Solarize extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'solarize'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const threshold = this.uniformName('threshold')
    return {
      main: `
vec3 col = mix(base.rgb, 1.0 - base.rgb, step(${threshold}, base.rgb));
return vec4(col, base.a);`,
    }
  }
}

register(Solarize)
export default Solarize
