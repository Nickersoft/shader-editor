import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { transformFields, zColor, zFloat } from '@/shaders/core/schemas'
import type { SpatialControl } from '@/shaders/core/spatial'

const config = z.object({
  ...transformFields(),
  thickness: zFloat(0.05, 1, 0.001).default(0.3).describe('Thickness'),
  rounding: zFloat(0, 1, 0.01).default(0).describe('Rounding'),
  fillColor: zColor().default([1, 1, 1]).describe('Fill'),
  strokeColor: zColor().default([0, 0, 0]).describe('Stroke'),
  strokeWidth: zFloat(0, 0.1, 0.001).default(0).describe('Stroke Width'),
  strokeMode: z.enum(['inside', 'center', 'outside']).default('center').describe('Stroke Mode'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Cross',
  description: 'Plus / cross filling its bounding box; thickness as ratio of the bbox',
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
  static readonly spatialControls: readonly SpatialControl[] = [
    {
      kind: 'transform',
      x: 'x',
      y: 'y',
      w: 'width',
      h: 'height',
      rotation: 'rotation',
      label: 'Bounds',
    },
  ]

  glsl(): GlslBlock {
    const x = this.uniformName('x')
    const y = this.uniformName('y')
    const w = this.uniformName('width')
    const h = this.uniformName('height')
    const rot = this.uniformName('rotation')
    const th = this.uniformName('thickness')
    const round = this.uniformName('rounding')
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
float sdCrossPlus(vec2 p, vec2 b, float thickness, float rounding) {
  vec2 ap = abs(p);
  return min(max(ap.x - b.x, ap.y - thickness), max(ap.y - b.y, ap.x - thickness)) - rounding;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${x}, ${y})) * _ar;
p = rotate2D(p, ${rot} * 3.14159265 / 180.0);
vec2 halfB = vec2(${w} * 0.5, ${h} * 0.5);
float thick = ${th} * min(${w}, ${h}) * 0.5;
float r = ${round} * min(${w}, ${h}) * 0.25;
float d = sdCrossPlus(p, halfB, thick, r);
float fillA = 1.0 - aastep(0.0, d);
float strokeA = (1.0 - aastep(${sw} * 0.5, abs(d - ${offset}))) * step(0.0001, ${sw});
vec3 col = mix(${fill}, ${stroke}, strokeA);
return vec4(col, max(fillA, strokeA));`,
    }
  }
}

register(Cross)
export default Cross
