import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  center: zCenter().default([0.5, 0.5]).describe('Center'),
  colorA: zColor().default([1, 1, 1]).describe('Color A'),
  colorB: zColor().default([0, 0, 0]).describe('Color B'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
  frequency: zFloat(1, 200, 1).default(20).describe('Frequency'),
  softness: zFloat(0, 1).default(0).describe('Softness'),
  thickness: zFloat(0, 1).default(0.5).describe('Thickness'),
  phase: zFloat(0, 6.2832, 0.01).default(0).describe('Phase'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Ripples',
  description: 'Concentric animated ripples emanating from a point',
  color: '#22d3ee',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Ripples extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'ripples'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const center = this.uniformName('center')
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const speed = this.uniformName('speed')
    const frequency = this.uniformName('frequency')
    const softness = this.uniformName('softness')
    const thickness = this.uniformName('thickness')
    const phase = this.uniformName('phase')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${center}) * _ar;
float r = length(p);
float w = r * ${frequency} - u_time * ${speed} * 4.0 + ${phase};
float band = 0.5 + 0.5 * cos(w);
float thick = clamp(${thickness}, 0.0, 1.0);
float soft = clamp(${softness}, 0.0, 1.0) * 0.49 + 0.005;
float lo = clamp(0.5 - thick * 0.5, 0.0, 1.0);
float hi = clamp(0.5 + thick * 0.5, 0.0, 1.0);
float ring = smoothstep(lo - soft, lo + soft, band) * (1.0 - smoothstep(hi - soft, hi + soft, band));
vec3 col = mix(${colorB}, ${colorA}, ring);
return vec4(col, 1.0);`,
    }
  }
}

register(Ripples)
export default Ripples
