import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.5).describe('Intensity'),
  detail: zFloat(0, 2, 0.05).default(1.0).describe('Detail'),
  evolutionSpeed: zFloat(0, 2, 0.05).default(0.3).describe('Evolution Speed'),
  edges: zEdges().default('mirror').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Flow Field',
  description: 'Fluid-like distortion with constant smooth motion',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FlowField extends EffectNode<Config, Inputs> {
  static readonly typeId = 'flow-field'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const detail = this.uniformName('detail')
    const evolutionSpeed = this.uniformName('evolutionSpeed')
    return {
      dependencies: ['simplex2D', 'applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
float t = u_time * ${evolutionSpeed};
vec2 offset = vec2(
  simplex2D(uv * ${detail} * 5.0 + t),
  simplex2D(uv * ${detail} * 5.0 + 7.3 + t)
) * ${intensity} * 0.1;
vec2 finalUV = uv + offset;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(FlowField)
export default FlowField
