import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  levels: zFloat(2, 16, 1).default(5).describe('Levels'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Posterize',
  description: 'Reduce to N color levels',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Posterize extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'posterize'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const levels = this.uniformName('levels')
    return {
      main: `
vec3 col = floor(base.rgb * ${levels} + 0.5) / ${levels};
return vec4(col, base.a);`,
    }
  }
}

register(Posterize)
export default Posterize
