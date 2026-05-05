import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.05, 0.05, 0.15]).describe('Color 1'),
  color2: zColor().default([0.5, 0.2, 0.6]).describe('Color 2'),
  color3: zColor().default([1.0, 0.8, 0.4]).describe('Color 3'),
  midPoint: zFloat(0.05, 0.95).default(0.5).describe('Mid Position'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  radius: zFloat(0.05, 2).default(0.6).describe('Radius'),
  rotation: zAngle().default(0).describe('Rotation'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Diamond Gradient',
  description: 'Diamond / Manhattan-distance gradient',
  color: '#fb923c',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DiamondGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'diamond-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const color3 = this.uniformName('color3')
    const midPoint = this.uniformName('midPoint')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const radius = this.uniformName('radius')
    const rotation = this.uniformName('rotation')
    return {
      dependencies: ['rotate2D'],
      functions: `vec3 sampleRamp(float t, vec3 c1, vec3 c2, vec3 c3, float mid) {
  if (t < mid) return mix(c1, c2, t / max(mid, 1e-4));
  return mix(c2, c3, (t - mid) / max(1.0 - mid, 1e-4));
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
p = rotate2D(p, ${rotation} * 3.14159 / 180.0);
float d = (abs(p.x) + abs(p.y)) / ${radius};
float t = clamp(d, 0.0, 1.0);
return vec4(sampleRamp(t, ${color1}, ${color2}, ${color3}, ${midPoint}), 1.0);`,
    }
  }
}

register(DiamondGradient)
export default DiamondGradient
