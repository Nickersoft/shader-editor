import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zAngle, zEdges, zFloat } from '@/shaders/core/schemas'

const WaveTypeSchema = z.enum(['sine', 'triangle', 'square', 'sawtooth', 'bounce'])

const config = z.object({
  waveType: WaveTypeSchema.default('sine').describe('Wave Type'),
  amplitude: zFloat(0, 1, 0.005).default(0.05).describe('Amplitude'),
  frequency: zFloat(0, 50, 0.5).default(5.0).describe('Frequency'),
  speed: zFloat(0, 5, 0.05).default(1.0).describe('Speed'),
  angle: zAngle().default(0.0).describe('Direction (deg)'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Wave Distortion',
  description: 'Periodic UV displacement along a direction',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

const WAVE_INDEX: Record<z.infer<typeof WaveTypeSchema>, number> = {
  sine: 0,
  triangle: 1,
  square: 2,
  sawtooth: 3,
  bounce: 4,
}

export class WaveDistortion extends EffectNode<Config, Inputs> {
  static readonly typeId = 'wave-distortion'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const amplitude = this.uniformName('amplitude')
    const frequency = this.uniformName('frequency')
    const speed = this.uniformName('speed')
    const angle = this.uniformName('angle')
    const waveIdx = WAVE_INDEX[this.config.waveType]
    let waveExpr: string
    switch (waveIdx) {
      case 0:
        waveExpr = `sin(phase * 2.0 * PI)`
        break
      case 1:
        waveExpr = `(2.0 * abs(2.0 * (phase - floor(phase + 0.5))) - 1.0)`
        break
      case 2:
        waveExpr = `sign(sin(phase * 2.0 * PI))`
        break
      case 3:
        waveExpr = `(2.0 * (phase - floor(phase + 0.5)))`
        break
      default:
        waveExpr = `(1.0 - 2.0 * abs(fract(phase) - 0.5) * 2.0)`
        break
    }
    return {
      dependencies: ['pi', 'applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
float ar = ${angle} * PI / 180.0;
vec2 dir = vec2(cos(ar), sin(ar));
vec2 perp = vec2(-dir.y, dir.x);
float phase = dot(dir, uv) * ${frequency} + u_time * ${speed};
float w = ${waveExpr};
vec2 finalUV = uv + perp * w * ${amplitude};
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(WaveDistortion)
export default WaveDistortion
