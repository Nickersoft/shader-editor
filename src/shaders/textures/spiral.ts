import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0, 0, 0]).describe('Color A'),
  colorB: zColor().default([1, 1, 1]).describe('Color B'),
  strokeWidth: zFloat(0, 1).default(0.5).describe('Stroke Width'),
  strokeFalloff: zFloat(0, 1).default(0).describe('Stroke Falloff'),
  softness: zFloat(0, 1).default(0).describe('Softness'),
  speed: zFloat(-4, 4, 0.05).default(1).describe('Speed'),
  center: zCenter().default([0.5, 0.5]).describe('Center'),
  scale: zFloat(0.1, 8, 0.05).default(1).describe('Scale'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Spiral',
  description: 'Rotating spiral pattern with animated movement',
  color: '#a855f7',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Spiral extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'spiral'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const strokeWidth = this.uniformName('strokeWidth')
    const strokeFalloff = this.uniformName('strokeFalloff')
    const softness = this.uniformName('softness')
    const speed = this.uniformName('speed')
    const center = this.uniformName('center')
    const scale = this.uniformName('scale')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
float r = length(p);
float a = atan(p.y, p.x) - u_time * ${speed};
float offset = r * ${scale} + a / 6.28318530;
float shape = abs(fract(offset) - 0.5) * 2.0;
float baseWidth = clamp(${strokeWidth}, ${strokeFalloff} * 0.005, 1.0);
float width = baseWidth * (1.0 - clamp(${strokeFalloff}, 0.0, 1.0) * r);
float soft = clamp(${softness}, 0.0, 1.0) + 0.001;
float res = smoothstep(width - soft, width + soft, shape);
vec3 col = mix(${colorA}, ${colorB}, res);
return vec4(col, 1.0);`,
    }
  }
}

register(Spiral)
export default Spiral
