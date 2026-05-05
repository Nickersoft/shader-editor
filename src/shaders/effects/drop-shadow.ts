import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0, 0, 0]).describe('Shadow Color'),
  opacity: zFloat(0, 1).default(0.5).describe('Opacity'),
  offsetX: zFloat(-0.1, 0.1, 0.001).default(0.005).describe('Offset X'),
  offsetY: zFloat(-0.1, 0.1, 0.001).default(0.005).describe('Offset Y'),
  blur: zFloat(0, 30, 0.5).default(4).describe('Blur'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Drop Shadow',
  description: 'Soft shadow behind opaque content',
  color: '#1e293b',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DropShadow extends EffectNode<Config, Inputs> {
  static readonly typeId = 'drop-shadow'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const opacity = this.uniformName('opacity')
    const offsetX = this.uniformName('offsetX')
    const offsetY = this.uniformName('offsetY')
    const blur = this.uniformName('blur')
    return {
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 r = texel * ${blur};
vec2 off = vec2(${offsetX}, ${offsetY});
float a = 0.0;
const int N = 3;
for (int i = -N; i <= N; i++) {
  for (int j = -N; j <= N; j++) {
    a += texture(u_prevPass, uv - off + r * vec2(float(i), float(j))).a;
  }
}
a /= float((2 * N + 1) * (2 * N + 1));
vec4 src = texture(u_prevPass, uv);
vec4 shadow = vec4(${color}, a * ${opacity});
vec4 col;
col.rgb = mix(shadow.rgb, src.rgb, src.a);
col.a = src.a + shadow.a * (1.0 - src.a);
return col;`,
    }
  }
}

register(DropShadow)
export default DropShadow
