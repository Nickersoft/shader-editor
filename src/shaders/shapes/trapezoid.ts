import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenterAxis, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  topWidth: zFloat(0, 1, 0.001).default(0.3).describe('Top Width'),
  bottomWidth: zFloat(0, 1, 0.001).default(0.5).describe('Bottom Width'),
  height: zFloat(0, 1, 0.001).default(0.4).describe('Height'),
  rotation: zAngle(1).default(0).describe('Rotation'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  fillColor: zColor().default([1, 1, 1]).describe('Fill'),
  strokeColor: zColor().default([0, 0, 0]).describe('Stroke'),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe('Stroke Width'),
  strokeMode: z.enum(['inside', 'center', 'outside']).default('center').describe('Stroke Mode'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Trapezoid',
  description: 'Trapezoid with adjustable top and bottom widths and height',
  color: '#f59e0b',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Trapezoid extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'trapezoid'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const tw = this.uniformName('topWidth')
    const bw = this.uniformName('bottomWidth')
    const h = this.uniformName('height')
    const rot = this.uniformName('rotation')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const fill = this.uniformName('fillColor')
    const stroke = this.uniformName('strokeColor')
    const sw = this.uniformName('strokeWidth')
    const offset =
      this.config.strokeMode === 'inside'
        ? `(-${sw} * 0.5)`
        : this.config.strokeMode === 'outside'
          ? `(${sw} * 0.5)`
          : `0.0`
    return {
      dependencies: ['aastep', 'rotate2D'],
      functions: `
float sdTrapezoid(vec2 p, float topWidth, float bottomWidth, float height) {
  vec2 k1 = vec2(bottomWidth, height);
  vec2 k2 = vec2(bottomWidth - topWidth, 2.0 * height);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, p.y < 0.0 ? bottomWidth : topWidth), abs(p.y) - height);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
float d = sdTrapezoid(p, ${tw} * 0.5, ${bw} * 0.5, ${h} * 0.5);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Trapezoid)
export default Trapezoid
