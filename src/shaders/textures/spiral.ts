import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.05, 0.05, 0.08]).describe('Background'),
  colorFront: zColor().default([0.95, 0.8, 0.4]).describe('Stroke'),
  centerX: zFloat(0, 1).default(0.5).describe('Center X'),
  centerY: zFloat(0, 1).default(0.5).describe('Center Y'),
  density: zFloat(1, 40, 0.1).default(6.0).describe('Density'),
  thickness: zFloat(0.05, 0.95).default(0.4).describe('Thickness'),
  speed: zFloat(-4, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Spiral',
  description: 'Animated logarithmic spiral with adjustable density',
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
    const colorBack = this.uniformName('colorBack')
    const colorFront = this.uniformName('colorFront')
    const cx = this.uniformName('centerX')
    const cy = this.uniformName('centerY')
    const density = this.uniformName('density')
    const thickness = this.uniformName('thickness')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - vec2(${cx}, ${cy})) * _ar;
float r = length(p);
float a = atan(p.y, p.x);
float phase = a + log(r + 1e-3) * ${density} + u_time * ${speed};
float t = fract(phase / 6.28318);
float m = 1.0 - aastep(${thickness}, abs(t - 0.5) * 2.0);
return vec4(mix(${colorBack}, ${colorFront}, m), 1.0);`,
    }
  }
}

register(Spiral)
export default Spiral
