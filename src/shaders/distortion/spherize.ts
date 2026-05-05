import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  radius: zFloat(0.05, 1.5).default(0.5).describe('Radius'),
  strength: zFloat(-1, 1).default(0.5).describe('Strength'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Spherize',
  description: 'Sphere lens distortion (fisheye)',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Spherize extends EffectNode<Config, Inputs> {
  static readonly typeId = 'spherize'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const strength = this.uniformName('strength')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
float r = length(d) / max(${radius}, 1e-4);
float warp = 1.0 - ${strength} * (1.0 - smoothstep(0.0, 1.0, r));
vec2 distorted = c + d * mix(1.0, warp, step(r, 1.0));
return texture(u_prevPass, distorted);`,
    }
  }
}

register(Spherize)
export default Spherize
