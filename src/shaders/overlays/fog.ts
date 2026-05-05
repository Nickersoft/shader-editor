import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.9, 0.92, 0.95]).describe('Color'),
  density: zFloat(0, 1).default(0.4).describe('Density'),
  falloff: zFloat(0.1, 4, 0.05).default(1.0).describe('Edge Falloff'),
  scale: zFloat(0.5, 20, 0.1).default(4.0).describe('Texture Scale'),
  speed: zFloat(0, 4, 0.05).default(0.2).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Fog',
  description: 'Soft volumetric haze',
  color: '#cbd5e1',
  category: 'overlays',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Fog extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'fog'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const density = this.uniformName('density')
    const falloff = this.uniformName('falloff')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['simplex2D'],
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float n = simplex2D(p * ${scale} + u_time * ${speed}) * 0.5 + 0.5;
float edge = pow(1.0 - smoothstep(0.0, 0.7, length(p)), ${falloff});
return vec4(${color}, n * edge * ${density});`,
    }
  }
}

register(Fog)
export default Fog
