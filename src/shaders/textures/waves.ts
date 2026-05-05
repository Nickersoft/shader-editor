import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  frequency: zFloat(1, 30, 0.5).default(10.0).describe('Frequency'),
  amplitude: zFloat(0, 0.5).default(0.1).describe('Amplitude'),
  speed: zFloat(0, 10, 0.1).default(2.0).describe('Speed'),
  direction: zAngle().default(0.0).describe('Direction'),
  color1: zColor().default([0.0, 0.3, 0.5]).describe('Color 1'),
  color2: zColor().default([0.0, 0.6, 0.8]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Waves',
  description: 'Animated wave distortion pattern',
  color: '#14b8a6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Waves extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'waves'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const frequency = this.uniformName('frequency')
    const amplitude = this.uniformName('amplitude')
    const speed = this.uniformName('speed')
    const direction = this.uniformName('direction')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    return {
      dependencies: ['rotate2D'],
      main: `
float dirRad = ${direction} * 3.14159 / 180.0;
vec2 waveUv = rotate2D(uv - 0.5, dirRad) + 0.5;
float wave = sin(waveUv.x * ${frequency} + u_time * ${speed}) * ${amplitude};
float t = waveUv.y + wave;
t = fract(t * 2.0);
vec3 col = mix(${color1}, ${color2}, t);
return vec4(col, 1.0);`,
    }
  }
}

register(Waves)
export default Waves
