import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.02, 0.04, 0.05]).describe('Background'),
  colorFront: zColor().default([0.55, 0.95, 0.7]).describe('Lines'),
  scale: zFloat(0.5, 20, 0.1).default(3.0).describe('Scale'),
  frequency: zFloat(1, 40, 0.5).default(8.0).describe('Line Frequency'),
  thickness: zFloat(0.05, 0.95).default(0.4).describe('Thickness'),
  speed: zFloat(0, 4, 0.05).default(0.0).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Contour Lines',
  description: 'Topographic contour lines from noise',
  color: '#84cc16',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ContourLines extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'contour-lines'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorFront = this.uniformName('colorFront')
    const scale = this.uniformName('scale')
    const frequency = this.uniformName('frequency')
    const thickness = this.uniformName('thickness')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D', 'aastep'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale} + u_time * ${speed} * 0.3;
float n = simplex2D(q) * 0.5 + 0.5;
float lines = abs(fract(n * ${frequency}) - 0.5) * 2.0;
float m = 1.0 - aastep(${thickness}, lines);
return vec4(mix(${colorBack}, ${colorFront}, m), 1.0);`,
    }
  }
}

register(ContourLines)
export default ContourLines
