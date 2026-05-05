import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.05, 0.0, 0.3]).describe('Shadow'),
  color2: zColor().default([1.0, 0.85, 0.5]).describe('Highlight'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Duotone',
  description: 'Map luminance to a 2-color gradient',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Duotone extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'duotone'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const c1 = this.uniformName('color1')
    const c2 = this.uniformName('color2')
    return {
      dependencies: ['luma'],
      main: `
float lum = luma(base.rgb);
return vec4(mix(${c1}, ${c2}, lum), base.a);`,
    }
  }
}

register(Duotone)
export default Duotone
