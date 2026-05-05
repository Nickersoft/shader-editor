import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  amount: zFloat(0, 0.2, 0.001).default(0.02).describe('Amount'),
  angle: zAngle().default(0.0).describe('Angle'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Channel Blur',
  description: 'Per-channel directional blur (rainbow ghost)',
  color: '#94a3b8',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ChannelBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'channel-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amount = this.uniformName('amount')
    const angle = this.uniformName('angle')
    return {
      main: `
float a = ${angle} * 3.14159 / 180.0;
vec2 dir = vec2(cos(a), sin(a)) * ${amount};
vec4 acc = vec4(0.0);
const int N = 6;
for (int i = 0; i < N; i++) {
  float t = float(i) / float(N - 1);
  vec2 oR = dir * mix(-1.0,  1.0, t);
  vec2 oG = dir * mix(-0.5,  0.5, t);
  vec2 oB = dir * mix(-1.5,  1.5, t);
  acc.r += texture(u_prevPass, uv + oR).r;
  acc.g += texture(u_prevPass, uv + oG).g;
  acc.b += texture(u_prevPass, uv + oB).b;
}
acc.rgb /= float(N);
acc.a = 1.0;
return acc;`,
    }
  }
}

register(ChannelBlur)
export default ChannelBlur
