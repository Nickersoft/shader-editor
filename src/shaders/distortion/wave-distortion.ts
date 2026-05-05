import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  frequency: zFloat(1, 60, 0.5).default(12.0).describe('Frequency'),
  amplitude: zFloat(0, 0.3, 0.005).default(0.02).describe('Amplitude'),
  speed: zFloat(0, 8, 0.05).default(1.5).describe('Speed'),
  angle: zAngle().default(0.0).describe('Direction (deg)'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Wave Distortion',
  description: 'Sine-wave UV displacement',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class WaveDistortion extends EffectNode<Config, Inputs> {
  static readonly typeId = 'wave-distortion'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const frequency = this.uniformName('frequency')
    const amplitude = this.uniformName('amplitude')
    const speed = this.uniformName('speed')
    const angle = this.uniformName('angle')
    return {
      dependencies: ['rotate2D'],
      main: `
vec2 q = rotate2D(uv - 0.5, ${angle} * 3.14159 / 180.0) + 0.5;
vec2 offset = vec2(
  sin(q.y * ${frequency} + u_time * ${speed}),
  cos(q.x * ${frequency} + u_time * ${speed})
) * ${amplitude};
return texture(u_prevPass, uv + offset);`,
    }
  }
}

register(WaveDistortion)
export default WaveDistortion
