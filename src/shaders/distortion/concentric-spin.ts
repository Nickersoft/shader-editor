import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  centerX: zCenterAxis().default(0.5).describe('Center X'),
  centerY: zCenterAxis().default(0.5).describe('Center Y'),
  rings: zFloat(1, 30, 1).default(8.0).describe('Rings'),
  intensity: zFloat(0, 1, 0.01).default(0.5).describe('Intensity'),
  speed: zFloat(-4, 4, 0.05).default(0.5).describe('Speed'),
  speedRandomness: zFloat(0, 1, 0.01).default(0.5).describe('Speed Randomness'),
  seed: zFloat(0, 1, 0.01).default(0.0).describe('Seed'),
  edges: zEdges().default('mirror').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Concentric Spin',
  description: 'Concentric rings rotating at different rates',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ConcentricSpin extends EffectNode<Config, Inputs> {
  static readonly typeId = 'concentric-spin'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const rings = this.uniformName('rings')
    const intensity = this.uniformName('intensity')
    const speed = this.uniformName('speed')
    const speedRandomness = this.uniformName('speedRandomness')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      functions: `
float concentricSpinHash(float x) {
  return (fract(sin(x * 12.9898) * 43758.5453) - 0.5) * 2.0;
}`,
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
float dx = (uv.x - ${cx}) * aspect;
float dy = (uv.y - (1.0 - ${cy}));
float ringCoord = length(vec2(dx, dy)) * ${rings};
float ringIndex = floor(ringCoord);
float ringFrac = fract(ringCoord);
float seedOffset = ${seed} * 13.7;
float maxAngle = ${intensity} * 1.5708;
float staticA = concentricSpinHash(ringIndex + seedOffset) * maxAngle;
float staticB = concentricSpinHash(ringIndex + 1.0 + seedOffset) * maxAngle;
float ringSpeedA = mix(1.0, concentricSpinHash(ringIndex + 42.7), ${speedRandomness});
float ringSpeedB = mix(1.0, concentricSpinHash(ringIndex + 1.0 + 42.7), ${speedRandomness});
float animA = u_time * ${speed} * 0.25 * ringSpeedA;
float animB = u_time * ${speed} * 0.25 * ringSpeedB;
float totalA = staticA + animA;
float totalB = staticB + animB;
float diff = mod(totalB - totalA + 3.14159265, 6.28318530) - 3.14159265;
float blend = smoothstep(0.49, 0.51, ringFrac);
float angle = totalA + diff * blend;
float ca = cos(angle);
float sa = sin(angle);
float rx = dx * ca - dy * sa;
float ry = dx * sa + dy * ca;
vec2 finalUV = vec2(rx / aspect + ${cx}, ry + (1.0 - ${cy}));
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(ConcentricSpin)
export default ConcentricSpin
