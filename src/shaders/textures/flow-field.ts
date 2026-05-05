import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.1, 0.05, 0.2]).describe('Color 1'),
  color2: zColor().default([0.2, 0.7, 0.9]).describe('Color 2'),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe('Scale'),
  iterations: zFloat(1, 12, 1).default(4.0).describe('Iterations'),
  speed: zFloat(0, 4, 0.05).default(0.4).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Flow Field',
  description: 'Curl-noise flow magnitude visualised as colour',
  color: '#06b6d4',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class FlowField extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'flow-field'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const scale = this.uniformName('scale')
    const iterations = this.uniformName('iterations')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale};
float t = u_time * ${speed};
for (int i = 0; i < 12; i++) {
  if (float(i) >= ${iterations}) break;
  float a = simplex2D(q + t) * 6.28318;
  q += vec2(cos(a), sin(a)) * 0.15;
}
float v = simplex2D(q) * 0.5 + 0.5;
return vec4(mix(${color1}, ${color2}, v), 1.0);`,
    }
  }
}

register(FlowField)
export default FlowField
