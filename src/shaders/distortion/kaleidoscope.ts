import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zAngle, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  segments: zFloat(2, 40, 1).default(8.0).describe('Segments'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  rotation: zAngle().default(0.0).describe('Rotation'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Kaleidoscope',
  description: 'N-fold radial mirror',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Kaleidoscope extends EffectNode<Config, Inputs> {
  static readonly typeId = 'kaleidoscope'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const segments = this.uniformName('segments')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const rotation = this.uniformName('rotation')
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d);
float a = atan(d.y, d.x) + ${rotation} * 3.14159 / 180.0;
float seg = 6.28318 / max(${segments}, 1.0);
a = abs(mod(a, seg) - seg * 0.5);
vec2 rd = vec2(cos(a), sin(a)) * r;
vec2 finalUV = c + rd;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(Kaleidoscope)
export default Kaleidoscope
