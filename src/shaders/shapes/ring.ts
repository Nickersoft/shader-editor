import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenterAxis, zColor, zFloat } from '@/shaders/core/schemas'
import type { SpatialControl } from '@/shaders/core/spatial'

const config = z.object({
  radius: zFloat(0, 1, 0.001).default(0.3).describe('Radius'),
  thickness: zFloat(0, 1, 0.001).default(0.07).describe('Thickness'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  fillColor: zColor().default([1, 1, 1]).describe('Fill'),
  strokeColor: zColor().default([0, 0, 0]).describe('Stroke'),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe('Stroke Width'),
  strokeMode: z.enum(['inside', 'center', 'outside']).default('center').describe('Stroke Mode'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Ring',
  description: 'Annular ring with adjustable radius and thickness',
  color: '#3b82f6',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Ring extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'ring'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly spatialControls: readonly SpatialControl[] = [
    { kind: 'point', x: 'centerX', y: 'centerY', label: 'Center' },
    { kind: 'radius', cx: 'centerX', cy: 'centerY', r: 'radius', label: 'Radius' },
  ]

  glsl(): GlslBlock {
    const r = this.uniformName('radius')
    const th = this.uniformName('thickness')
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
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float d = abs(length(p) - ${r}) - ${th} * 0.5;
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Ring)
export default Ring
