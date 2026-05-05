import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  mode: zFloat(0, 1, 1).default(0.0).describe('Mode (0=R→P, 1=P→R)'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
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
    const mode = this.uniformName('mode')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    return {
      main: `
vec2 c = vec2(${cx}, ${cy});
vec2 d = uv - c;
vec2 q;
if (${mode} < 0.5) {
  float r = length(d);
  float a = atan(d.y, d.x) / 6.28318 + 0.5;
  q = vec2(a, r);
} else {
  float a = (uv.x - 0.5) * 6.28318;
  float r = uv.y;
  q = c + vec2(cos(a), sin(a)) * r;
}
return texture(u_prevPass, q);`,
    }
  }
}

register(PolarCoordinates)
export default PolarCoordinates
