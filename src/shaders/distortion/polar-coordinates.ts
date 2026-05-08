import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  mode: z.enum(['rect-to-polar', 'polar-to-rect']).default('rect-to-polar').describe('Mode'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  radius: zFloat(0, 1, 0.01).default(0.5).describe('Radius'),
  intensity: zFloat(0, 1, 0.01).default(1.0).describe('Intensity'),
  edges: zEdges().default('transparent').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Polar Coordinates',
  description: 'Rectangular ↔ polar UV remap',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class PolarCoordinates extends EffectNode<Config, Inputs> {
  static readonly typeId = 'polar-coordinates'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const intensity = this.uniformName('intensity')
    const isRectToPolar = this.config.mode === 'rect-to-polar'
    const transformed = isRectToPolar
      ? `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 centerPos = vec2(${cx} * aspect, 1.0 - ${cy});
vec2 delta = aspectUV - centerPos;
float angleN = (atan(delta.y, delta.x) + 3.14159265) / 6.28318530;
float r = length(delta) / max(${radius}, 1e-4);
vec2 transformed = vec2(angleN, r);`
      : `
float angle = (uv.x - 0.5) * 6.28318530;
float r = uv.y * ${radius};
vec2 transformed = vec2(${cx} + cos(angle) * r, (1.0 - ${cy}) + sin(angle) * r);`
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `${transformed}
vec2 finalUV = mix(uv, transformed, ${intensity});
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(PolarCoordinates)
export default PolarCoordinates
