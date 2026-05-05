import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  lightAngle: zAngle().default(135).describe('Light Angle'),
  intensity: zFloat(0, 4, 0.05).default(1.5).describe('Intensity'),
  ambient: zFloat(0, 1).default(0.4).describe('Ambient'),
  specular: zFloat(0, 1).default(0.6).describe('Specular'),
  thickness: zFloat(0.1, 8, 0.1).default(1.5).describe('Detail'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Chrome Relief',
  description: 'Metallic highlight from luma gradient — use before a chrome Color Ramp',
  color: '#94a3b8',
  category: 'effects',
  defaultBlendMode: 'normal',
  outputKind: 'scalar',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ChromeRelief extends EffectNode<Config, Inputs> {
  static readonly typeId = 'chrome-relief'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const lightAngle = this.uniformName('lightAngle')
    const intensity = this.uniformName('intensity')
    const ambient = this.uniformName('ambient')
    const specular = this.uniformName('specular')
    const thickness = this.uniformName('thickness')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution * ${thickness};
float a = ${lightAngle} * 3.14159 / 180.0;
vec2 ldir = vec2(cos(a), sin(a));
float lc = luma(texture(u_prevPass, uv).rgb);
float lx = luma(texture(u_prevPass, uv + vec2(texel.x, 0.0)).rgb)
         - luma(texture(u_prevPass, uv - vec2(texel.x, 0.0)).rgb);
float ly = luma(texture(u_prevPass, uv + vec2(0.0, texel.y)).rgb)
         - luma(texture(u_prevPass, uv - vec2(0.0, texel.y)).rgb);
vec2 grad = vec2(lx, ly);
float diffuse = dot(normalize(grad + vec2(1e-5)), ldir) * 0.5 + 0.5;
float spec = pow(clamp(diffuse, 0.0, 1.0), 8.0) * ${specular};
float v = clamp(${ambient} + diffuse * ${intensity} + spec, 0.0, 1.0);
return vec4(v, v, v, 1.0);`,
    }
  }
}

register(ChromeRelief)
export default ChromeRelief
