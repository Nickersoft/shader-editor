import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  amount: zFloat(0, 0.5, 0.005).default(0.05).describe('Amount'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Angular Blur',
  description: 'Circular blur around a focal point',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class AngularBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'angular-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const amount = this.uniformName('amount')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
vec4 acc = vec4(0.0);
const int N = 8;
for (int i = 0; i < N; i++) {
  float a = (float(i) - float(N - 1) * 0.5) * ${amount};
  float ca = cos(a), sa = sin(a);
  vec2 rd = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
  acc += texture(u_prevPass, c + rd);
}
return acc / float(N);`,
    }
  }
}

register(AngularBlur)
export default AngularBlur
