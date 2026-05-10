import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColorRgba, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColorRgba().default([1, 1, 1, 1]).describe('Color A'),
  colorB: zColorRgba().default([1, 1, 1, 0]).describe('Color B'),
  angle: zAngle(1).default(90).describe('Angle'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  speedVariance: zFloat(0, 1).default(0.3).describe('Speed Variance'),
  density: zFloat(2, 100, 1).default(15).describe('Density'),
  trailLength: zFloat(0, 1).default(0.35).describe('Trail Length'),
  balance: zFloat(0, 1).default(0.5).describe('Balance'),
  strokeWidth: zFloat(0, 1).default(0.15).describe('Stroke Width'),
  rounding: zFloat(0, 1).default(1).describe('Rounding'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Falling Lines',
  description: 'Directional falling lines with a leading-to-trailing color fade',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FallingLines extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'falling-lines'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const angle = this.uniformName('angle')
    const speed = this.uniformName('speed')
    const speedVariance = this.uniformName('speedVariance')
    const density = this.uniformName('density')
    const trailLength = this.uniformName('trailLength')
    const balance = this.uniformName('balance')
    const strokeWidth = this.uniformName('strokeWidth')
    const rounding = this.uniformName('rounding')
    return {
      dependencies: ['hash21', 'rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
p = rotate2D(p, -(${angle} - 90.0) * 3.14159265 / 180.0);
float dens = ${density};
float colId = floor(p.x * dens);
float jitter = hash21(vec2(colId, 7.0));
float jSpeed = mix(1.0 - ${speedVariance}, 1.0 + ${speedVariance}, jitter);
float yOff = u_time * ${speed} * 0.6 * jSpeed + jitter * 9.7;
float spacing = max(${trailLength} * 1.6, 0.05);
float lane = fract(p.y + yOff) / spacing;
float along = clamp(lane, 0.0, 1.0);
float on = step(lane, 1.0);
float xLocal = (fract(p.x * dens) - 0.5) * 2.0;
float halfW = clamp(${strokeWidth}, 0.001, 1.0);
float stroke = 1.0 - smoothstep(halfW * 0.95, halfW, abs(xLocal));
// Round leading cap.
float cap = 1.0 - smoothstep(0.95, 1.0, along);
float roundCap = mix(1.0, cap, ${rounding});
float lineMask = stroke * on * roundCap;
float mixT = mix(along, smoothstep(0.0, 1.0, along), 1.0);
mixT = clamp(mixT + (${balance} - 0.5), 0.0, 1.0);
vec4 col = mix(${colorA}, ${colorB}, mixT);
return vec4(col.rgb * lineMask * col.a, col.a * lineMask);`,
    }
  }
}

register(FallingLines)
export default FallingLines
