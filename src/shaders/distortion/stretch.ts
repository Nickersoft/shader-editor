import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zAngle, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  angle: zAngle().default(0.0).describe('Angle'),
  strength: zFloat(-1, 1, 0.01).default(0.0).describe('Strength'),
  falloff: zFloat(0, 1, 0.01).default(0.5).describe('Falloff'),
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Stretch',
  description: 'Directional stretch with falloff',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Stretch extends EffectNode<Config, Inputs> {
  static readonly typeId = 'stretch'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const angle = this.uniformName('angle')
    const strength = this.uniformName('strength')
    const falloff = this.uniformName('falloff')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    return {
      dependencies: ['pi', 'applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float ar = ${angle} * PI / 180.0;
vec2 dir = vec2(cos(ar), sin(ar));
float proj = dot(d, dir);
vec2 perp = d - dir * proj;
float fall = smoothstep(${falloff}, 0.0, abs(proj));
float scale = 1.0 + ${strength} * fall;
vec2 newD = dir * (proj * scale) + perp;
vec2 finalUV = c + newD;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(Stretch)
export default Stretch
