import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenterAxis, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  sizeX: zFloat(0.01, 1, 0.001).default(0.35).describe('Width'),
  sizeY: zFloat(0.01, 1, 0.001).default(0.08).describe('Thickness'),
  rounding: zFloat(0, 1, 0.01).default(0).describe('Rounding'),
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
  name: 'Cross',
  description: 'Plus/cross shape',
  color: '#3b82f6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Cross extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'cross'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const sx = this.uniformName('sizeX')
    const sy = this.uniformName('sizeY')
    const round = this.uniformName('rounding')
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
float sdCrossPlus(vec2 p, float size, float thickness, float rounding) {
  float px = abs(p.x);
  float py = abs(p.y);
  return min(max(px - size, py - thickness), max(py - size, px - thickness)) - rounding;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
float d = sdCrossPlus(p, ${sx}, ${sy}, ${round} * min(${sx}, ${sy}));
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Cross)
export default Cross
