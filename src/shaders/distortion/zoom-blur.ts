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
  name: 'Zoom Blur',
  description: 'Radial zoom blur from a focal point',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ZoomBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'zoom-blur'
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
const int N = 12;
for (int i = 0; i < N; i++) {
  float t = (float(i) / float(N - 1) - 0.5) * 2.0;
  acc += texture(u_prevPass, c + d * (1.0 + t * ${amount}));
}
return acc / float(N);`,
    }
  }
}

register(ZoomBlur)
export default ZoomBlur
