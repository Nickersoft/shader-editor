import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenterAxis, zColor, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  radius: zFloat(0.05, 1, 0.001).default(0.4).describe('Radius'),
  petals: zInt(3, 16).default(5).describe('Petals'),
  innerRatio: zFloat(0.1, 0.95, 0.01).default(0.4).describe('Inner Ratio'),
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
  name: 'Flower',
  description: 'Petal shape with N lobes and adjustable inner-to-outer radius ratio',
  color: '#f472b6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Flower extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'flower'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const r = this.uniformName('radius')
    const petals = this.uniformName('petals')
    const ir = this.uniformName('innerRatio')
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
float sdFlower(vec2 p, float outerRadius, float sides, float innerRatio) {
  float a = atan(p.y, p.x);
  float len = length(p);
  float innerRadius = outerRadius * innerRatio;
  float tA = a * sides / 6.28318530718;
  float t = abs((tA - floor(tA)) * 2.0 - 1.0);
  float boundary = innerRadius + (outerRadius - innerRadius) * t;
  return len - boundary;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
float d = sdFlower(p, ${r}, float(${petals}), ${ir});
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Flower)
export default Flower
