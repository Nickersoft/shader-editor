import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.95, 0.3, 0.6]).describe('Color 1'),
  color2: zColor().default([0.3, 0.5, 0.95]).describe('Color 2'),
  color3: zColor().default([0.6, 0.95, 0.7]).describe('Color 3'),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Plasma',
  description: 'Multi-octave colour wash — soft, liquid background',
  color: '#ec4899',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Plasma extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'plasma'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const color3 = this.uniformName('color3')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed};
vec2 q = p * ${scale};
float v =  sin(q.x + t);
v += sin((q.y + t) * 0.5);
v += sin((q.x + q.y + t) * 0.5);
vec2 c = q + 0.5 * vec2(sin(t * 0.3), cos(t * 0.4));
v += sin(length(c) + t);
v *= 0.25;
float a = 0.5 + 0.5 * sin(v * 3.14159);
float b = 0.5 + 0.5 * cos(v * 3.14159);
vec3 col = mix(mix(${color1}, ${color2}, a), ${color3}, b);
return vec4(col, 1.0);`,
    }
  }
}

register(Plasma)
export default Plasma
