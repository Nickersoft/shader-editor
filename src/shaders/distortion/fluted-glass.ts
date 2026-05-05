import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  size: zFloat(0, 1).default(0.5).describe('Lane Width'),
  angle: zAngle().default(0.0).describe('Angle'),
  shape: zInt(0, 2).default(0).describe('Shape'),
  distortion: zFloat(0, 1).default(0.5).describe('Distortion'),
  highlights: zFloat(0, 1).default(0.4).describe('Highlights'),
  shadows: zFloat(0, 1).default(0.4).describe('Shadows'),
  shift: zFloat(-0.5, 0.5).default(0.0).describe('Shift'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Fluted Glass',
  description: 'Refractive lanes — pair with image-source for fluted-glass effect',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FlutedGlass extends EffectNode<Config, Inputs> {
  static readonly typeId = 'fluted-glass'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const size = this.uniformName('size')
    const angle = this.uniformName('angle')
    const shape = this.uniformName('shape')
    const distortion = this.uniformName('distortion')
    const highlights = this.uniformName('highlights')
    const shadows = this.uniformName('shadows')
    const shift = this.uniformName('shift')
    return {
      dependencies: ['rotate2D'],
      main: `
float patternRotation = -${angle} * 3.14159 / 180.0;
float patternSize = mix(200.0, 5.0, clamp(${size}, 0.0, 1.0));
vec2 q = (uv - 0.5) * patternSize;
q = rotate2D(q, patternRotation);
float laneIdx = floor(q.x);
float xRaw = fract(q.x);
float x = abs(xRaw - 0.5) * 2.0;
float distortion = 0.0;
if (${shape} == 0) {
  distortion = -pow(1.5 * x, 3.0);
  distortion += (0.5 - ${shift});
} else if (${shape} == 1) {
  distortion = 2.0 * pow(x, 2.0);
  distortion -= (0.5 + ${shift});
} else {
  distortion = pow(2.0 * (xRaw - 0.5), 6.0);
  distortion -= 0.25 + ${shift};
}
vec2 dir = vec2(cos(patternRotation), sin(patternRotation));
vec2 refractUv = uv + dir * distortion * ${distortion} * 0.05;
vec4 src = texture(u_prevPass, refractUv);
float edgeWidth = 2.0 * max(0.001, fwidth(xRaw));
float edge = smoothstep(0.0, edgeWidth, xRaw) * smoothstep(1.0, 1.0 - edgeWidth, xRaw);
float highlight = (1.0 - edge) * ${highlights};
float shadow = pow(x, 1.3) * ${shadows};
vec3 col = src.rgb;
col = mix(col, col * (1.0 - shadow), shadow);
col = mix(col, vec3(1.0), highlight);
return vec4(col, src.a);`,
    }
  }
}

register(FlutedGlass)
export default FlutedGlass
