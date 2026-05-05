import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.1, 0.001).default(0.01).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Diffuse Blur',
  description: 'Random-jitter blur (painterly softness)',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DiffuseBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'diffuse-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    return {
      dependencies: ['hash2'],
      main: `
vec4 acc = vec4(0.0);
const int N = 12;
for (int i = 0; i < N; i++) {
  vec2 j = (hash2(uv * u_resolution + float(i) * 31.7) - 0.5) * 2.0 * ${amount};
  acc += texture(u_prevPass, uv + j);
}
return acc / float(N);`,
    }
  }
}

register(DiffuseBlur)
export default DiffuseBlur
