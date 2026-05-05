import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.3, 0.005).default(0.03).describe('Amount'),
  angle: zAngle().default(0.0).describe('Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Linear Blur',
  description: 'Directional motion blur',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LinearBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'linear-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const angle = this.uniformName('angle')
    return {
      main: `
float a = ${angle} * 3.14159 / 180.0;
vec2 dir = vec2(cos(a), sin(a));
vec4 acc = vec4(0.0);
const int N = 12;
for (int i = 0; i < N; i++) {
  float t = (float(i) / float(N - 1) - 0.5) * 2.0;
  acc += texture(u_prevPass, uv + dir * t * ${amount});
}
return acc / float(N);`,
    }
  }
}

register(LinearBlur)
export default LinearBlur
