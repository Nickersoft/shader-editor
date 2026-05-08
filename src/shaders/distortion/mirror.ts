import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zAngle, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  angle: zAngle().default(90.0).describe('Axis Angle'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  side: zFloat(-1, 1, 1).default(1.0).describe('Mirror Side'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Mirror',
  description: 'Reflect across an axis',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Mirror extends EffectNode<Config, Inputs> {
  static readonly typeId = 'mirror'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const angle = this.uniformName('angle')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const side = this.uniformName('side')
    return {
      dependencies: ['rotate2D', 'applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
vec2 c = vec2(${cx}, ${cy});
float a = ${angle} * 3.14159 / 180.0;
vec2 d = rotate2D(uv - c, -a);
d.x = abs(d.x) * ${side};
vec2 finalUV = c + rotate2D(d, a);
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(Mirror)
export default Mirror
