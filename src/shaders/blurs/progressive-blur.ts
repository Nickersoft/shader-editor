import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenterAxis, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe('Intensity'),
  angle: zAngle().default(90).describe('Angle'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  falloff: zFloat(0, 1, 0.01).default(0.5).describe('Falloff'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Progressive Blur',
  description: 'Blur strength ramps along an axis',
  color: '#94a3b8',
  category: 'blurs',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ProgressiveBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'progressive-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const angle = this.uniformName('angle')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const falloff = this.uniformName('falloff')
    return {
      dependencies: ['gaussian13'],
      main: `
vec2 texel = 1.0 / u_resolution;
float aspect = u_resolution.x / u_resolution.y;
float a = ${angle} * 3.14159265 / 180.0;
vec2 dir = vec2(cos(a) / aspect, sin(a));
vec2 d = uv - vec2(${cx}, ${cy});
float proj = max(0.0, dot(d, dir));
float fo = max(0.001, ${falloff});
float t = smoothstep(0.0, fo, proj);
float r = t * ${intensity} * 100.0 * 0.36;
vec4 h = gaussian13(u_prevPass, uv, vec2(texel.x * r, 0.0));
vec4 v = gaussian13(u_prevPass, uv, vec2(0.0, texel.y * r));
return (h + v) * 0.5;`,
    }
  }
}

register(ProgressiveBlur)
export default ProgressiveBlur
