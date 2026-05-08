import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zVec2 } from '@/shaders/core/schemas'

const config = z.object({
  startX: zFloat(0, 1).default(0.2).describe('Start X'),
  startY: zFloat(0, 1).default(0.5).describe('Start Y'),
  endX: zFloat(0, 1).default(0.8).describe('End X'),
  endY: zFloat(0, 1).default(0.5).describe('End Y'),
  softness: zFloat(0, 1).default(0.3).describe('Softness'),
  intensity: zFloat(0, 2).default(1).describe('Intensity'),
  color1: zColor().default([1, 0.5, 0.2]).describe('Color 1'),
  color2: zColor().default([0.2, 0.5, 1]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Beam',
  description: 'Soft directional light beam between two points',
  color: '#fde68a',
  category: 'textures',
  defaultBlendMode: 'add',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Beam extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'beam'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const startX = this.uniformName('startX')
    const startY = this.uniformName('startY')
    const endX = this.uniformName('endX')
    const endY = this.uniformName('endY')
    const softness = this.uniformName('softness')
    const intensity = this.uniformName('intensity')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['sdSegment'],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 s = vec2(${startX} * aspect, ${startY});
vec2 e = vec2(${endX} * aspect, ${endY});
vec2 p = vec2(uv.x * aspect, uv.y);
vec2 ba = e - s;
vec2 pa = p - s;
float lenSq = max(dot(ba, ba), 1e-6);
float t = clamp(dot(pa, ba) / lenSq, 0.0, 1.0);
float d = sdSegment(p, s, e);
float soft = max(${softness}, 1e-4);
float a = (1.0 - smoothstep(0.0, soft, d)) * ${intensity};
vec3 col = mix(${color1}, ${color2}, t);
return vec4(col * a, a);`,
    }
  }
}

register(Beam)
export default Beam
