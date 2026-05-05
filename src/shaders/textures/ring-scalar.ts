import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zFloat(-0.5, 1.5).default(0.5).describe('Center X'),
  centerY: zFloat(-0.5, 1.5).default(0.5).describe('Center Y'),
  radius: zFloat(0, 1).default(0.4).describe('Radius'),
  thickness: zFloat(0.01, 1).default(0.3).describe('Thickness'),
  innerShape: zFloat(0, 4, 0.05).default(1.0).describe('Inner Shape'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Ring Scalar',
  description: 'Smooth ring profile (radius/thickness/inner-fill) as a scalar field',
  color: '#94a3b8',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class RingScalar extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'ring-scalar'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const thickness = this.uniformName('thickness')
    const innerShape = this.uniformName('innerShape')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float d = length(p);
float v = 1.0 - smoothstep(${radius}, ${radius} + ${thickness}, d);
v *= smoothstep(${radius} - pow(${innerShape}, 3.0) * ${thickness}, ${radius}, d);
return vec4(vec3(v), 1.0);`,
    }
  }
}

register(RingScalar)
export default RingScalar
