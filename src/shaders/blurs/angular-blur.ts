import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenterAxis, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe('Intensity'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Angular Blur',
  description: 'Circular blur around a focal point',
  color: '#94a3b8',
  category: 'blurs',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

const WEIGHTS = `const float W[32] = float[32](
  0.018339, 0.020218, 0.022146, 0.024100, 0.026056, 0.027988, 0.029869, 0.031669,
  0.033361, 0.034915, 0.036304, 0.037504, 0.038492, 0.039251, 0.039765, 0.040024,
  0.040024, 0.039765, 0.039251, 0.038492, 0.037504, 0.036304, 0.034915, 0.033361,
  0.031669, 0.029869, 0.027988, 0.026056, 0.024100, 0.022146, 0.020218, 0.018339
);`

export class AngularBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'angular-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    return {
      dependencies: ['pi'],
      main: `
${WEIGHTS}
vec2 center = vec2(${cx}, ${cy});
float aspect = u_resolution.x / u_resolution.y;
vec2 d = uv - center;
vec2 dc = vec2(d.x * aspect, d.y);
float arc = ${intensity} * PI;
float step = arc / 31.0;
vec4 acc = vec4(0.0);
for (int i = 0; i < 32; i++) {
  float a = (float(i) - 15.5) * step;
  float ca = cos(a);
  float sa = sin(a);
  vec2 rd = vec2(dc.x * ca - dc.y * sa, dc.x * sa + dc.y * ca);
  vec2 sc = vec2(rd.x / aspect, rd.y) + center;
  acc += texture(u_prevPass, sc) * W[i];
}
return acc;`,
    }
  }
}

register(AngularBlur)
export default AngularBlur
