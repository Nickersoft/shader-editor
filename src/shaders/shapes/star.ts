import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenterAxis, zColor, zFloat, zInt } from '@/shaders/core/schemas'
import type { SpatialControl } from '@/shaders/core/spatial'

const config = z.object({
  radius: zFloat(0.001, 1, 0.001).default(0.4).describe('Radius'),
  points: zInt(3, 12).default(5).describe('Points'),
  innerRatio: zFloat(0.1, 0.9, 0.01).default(0.4).describe('Inner Ratio'),
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
  name: 'Star',
  description: 'N-pointed star with adjustable inner radius ratio',
  color: '#3b82f6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Star extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'star'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly spatialControls: readonly SpatialControl[] = [
    { kind: 'point', x: 'centerX', y: 'centerY', label: 'Center' },
    { kind: 'radius', cx: 'centerX', cy: 'centerY', r: 'radius', label: 'Radius' },
  ]

  glsl(): GlslBlock {
    const r = this.uniformName('radius')
    const pts = this.uniformName('points')
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
float sdStarRatio(vec2 p, float outerRadius, float sides, float innerRatio) {
  float innerRadius = outerRadius * innerRatio;
  float len = length(p);
  float a = atan(p.y, p.x);
  float sectorAngle = 6.28318530718 / sides;
  float sectorIdx = floor(a / sectorAngle + 0.5);
  float bn = a - sectorIdx * sectorAngle;
  float fpx = abs(len * sin(bn));
  float fpy = len * cos(bn);
  float an = 3.14159265 / sides;
  float ex = innerRadius * sin(an);
  float ey = innerRadius * cos(an) - outerRadius;
  float qx = fpx;
  float qy = fpy - outerRadius;
  float t = clamp((qx * ex + qy * ey) / (ex * ex + ey * ey), 0.0, 1.0);
  float nx = fpx - ex * t;
  float ny = fpy - (outerRadius + ey * t);
  float dist = sqrt(nx * nx + ny * ny);
  float crossV = ex * qy - ey * qx;
  return dist * sign(crossV);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
float d = sdStarRatio(p, ${r}, float(${pts}), ${ir});
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Star)
export default Star
