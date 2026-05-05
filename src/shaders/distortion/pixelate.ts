import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  cells: zFloat(4, 400, 1).default(80.0).describe('Cells'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Pixelate',
  description: 'Reduce resolution to discrete cells',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Pixelate extends EffectNode<Config, Inputs> {
  static readonly typeId = 'pixelate'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cells = this.uniformName('cells')
    return {
      main: `
vec2 cells = vec2(${cells}, ${cells} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 q = (floor(uv * cells) + 0.5) / cells;
return texture(u_prevPass, q);`,
    }
  }
}

register(Pixelate)
export default Pixelate
