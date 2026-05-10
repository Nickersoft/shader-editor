import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  intensity: zFloat(0, 1, 0.01).default(1.0).describe('Intensity'),
  edges: zEdges().default('transparent').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Rectangular Coordinates',
  description: 'Square ↔ circle remap via Fernandez-Guasti mapping',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class RectangularCoordinates extends EffectNode<Config, Inputs> {
  static readonly typeId = 'rectangular-coordinates'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const intensity = this.uniformName('intensity')
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 p = (uv - c) * 2.0;
float x = clamp(p.x, -1.0, 1.0);
float y = clamp(p.y, -1.0, 1.0);
float u = x * sqrt(max(1.0 - y * y * 0.5, 0.0));
float v = y * sqrt(max(1.0 - x * x * 0.5, 0.0));
vec2 mapped = c + vec2(u, v) * 0.5;
vec2 finalUV = mix(uv, mapped, ${intensity});
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(RectangularCoordinates)
export default RectangularCoordinates
