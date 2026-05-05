import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.1, 0.1, 0.12]).describe('Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Solid Color',
  description: 'Single flat color over the entire canvas',
  color: '#a3a3a3',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SolidColor extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'solid-color'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    return {
      main: `
return vec4(${color}, 1.0);`,
    }
  }
}

register(SolidColor)
export default SolidColor
