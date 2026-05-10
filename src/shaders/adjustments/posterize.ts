import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zInt } from '@/shaders/core/schemas'

const config = z.object({
  levels: zInt(2, 16).default(6).describe('Levels'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Posterize',
  description: 'Reduce color depth to create a poster effect',
  color: '#475569',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Posterize extends EffectNode<Config, Inputs> {
  static readonly typeId = 'posterize'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const levels = this.uniformName('levels')
    return {
      main: `
base = texture(u_prevPass, uv);
float steps = float(${levels});
vec3 col = floor(base.rgb * steps + 0.5) / steps;
return vec4(col, base.a);`,
    }
  }
}

register(Posterize)
export default Posterize
