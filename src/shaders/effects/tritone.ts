import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.05, 0.0, 0.2]).describe('Shadow'),
  color2: zColor().default([0.7, 0.3, 0.5]).describe('Mid'),
  color3: zColor().default([1.0, 0.95, 0.7]).describe('Highlight'),
  midPoint: zFloat(0.05, 0.95).default(0.5).describe('Mid'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Tritone',
  description: 'Three-tone luminance map',
  color: '#a855f7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Tritone extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'tritone'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const c1 = this.uniformName('color1')
    const c2 = this.uniformName('color2')
    const c3 = this.uniformName('color3')
    const mp = this.uniformName('midPoint')
    return {
      dependencies: ['luma'],
      main: `
float lum = luma(base.rgb);
vec3 col = lum < ${mp}
  ? mix(${c1}, ${c2}, lum / max(${mp}, 1e-4))
  : mix(${c2}, ${c3}, (lum - ${mp}) / max(1.0 - ${mp}, 1e-4));
return vec4(col, base.a);`,
    }
  }
}

register(Tritone)
export default Tritone
