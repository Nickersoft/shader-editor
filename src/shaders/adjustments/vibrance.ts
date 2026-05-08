import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(-2, 2).default(0).describe('Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Vibrance',
  description: 'Selective saturation adjustment protecting skin tones',
  color: '#a855f7',
  category: 'adjustments',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Vibrance extends EffectNode<Config, Inputs> {
  static readonly typeId = 'vibrance'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    return {
      main: `
base = texture(u_prevPass, uv);
float mx = max(base.r, max(base.g, base.b));
float avg = (base.r + base.g + base.b) / 3.0;
float amt = (mx - avg) * ${intensity} * -3.0;
vec3 col = mix(base.rgb, vec3(mx), amt);
return vec4(col, base.a);`,
    }
  }
}

register(Vibrance)
export default Vibrance
