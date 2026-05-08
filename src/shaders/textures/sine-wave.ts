import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zCenter, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1, 1, 1]).describe('Color'),
  amplitude: zFloat(0, 0.5).default(0.15).describe('Amplitude'),
  frequency: zFloat(0, 20, 0.05).default(1).describe('Frequency'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
  angle: zAngle(1).default(0).describe('Angle'),
  position: zCenter().default([0.5, 0.5]).describe('Position'),
  thickness: zFloat(0, 1).default(0.2).describe('Thickness'),
  softness: zFloat(0, 1).default(0.4).describe('Softness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Sine Wave',
  description: 'Animated wave with thickness and softness',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SineWave extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'sine-wave'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const amp = this.uniformName('amplitude')
    const freq = this.uniformName('frequency')
    const speed = this.uniformName('speed')
    const angle = this.uniformName('angle')
    const position = this.uniformName('position')
    const thickness = this.uniformName('thickness')
    const softness = this.uniformName('softness')
    return {
      dependencies: ['rotate2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - ${position}) * _ar;
p = rotate2D(p, ${angle} * 3.14159265 / 180.0);
float y = ${amp} * sin(p.x * ${freq} * 6.2831853 + u_time * ${speed});
float d = abs(p.y - y);
float thick = ${thickness} * 0.25;
float soft = ${softness} * thick + 0.0008;
float m = 1.0 - smoothstep(thick, thick + soft, d);
return vec4(${color} * m, m);`,
    }
  }
}

register(SineWave)
export default SineWave
