import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorFront: zColor().default([0.62, 0.68, 0.74]).describe('Dark Fiber'),
  colorBack: zColor().default([1, 1, 1]).describe('Base'),
  fiber: zFloat(0, 1).default(0.3).describe('Fiber'),
  fiberScale: zFloat(4, 300, 1).default(60).describe('Fiber Scale'),
  fiberAngle: zAngle().default(0).describe('Fiber Angle'),
  crumples: zFloat(0, 1).default(0.2).describe('Crumples'),
  crumpleScale: zFloat(2, 200, 1).default(40).describe('Crumple Scale'),
  contrast: zFloat(0, 1).default(0.5).describe('Contrast'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Material Noise',
  description: 'Layered fiber, crumple, and fold texture — use with Multiply/Overlay blend',
  color: '#fef3c7',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class MaterialNoise extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'material-noise'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorFront = this.uniformName('colorFront')
    const colorBack = this.uniformName('colorBack')
    const fiber = this.uniformName('fiber')
    const fiberScale = this.uniformName('fiberScale')
    const fiberAngle = this.uniformName('fiberAngle')
    const crumples = this.uniformName('crumples')
    const crumpleScale = this.uniformName('crumpleScale')
    const contrast = this.uniformName('contrast')
    return {
      dependencies: ['simplex2D', 'rotate2D'],
      main: `
vec2 fq = rotate2D(uv * ${fiberScale}, ${fiberAngle} * 3.14159 / 180.0);
float fiberN = simplex2D(fq) * 0.5 + simplex2D(fq * 3.1) * 0.25 + simplex2D(fq * 7.3) * 0.125;
fiberN = fiberN * 0.5 + 0.5;
vec2 cq = uv * ${crumpleScale};
float crumpleN = abs(simplex2D(cq) * 0.6 + simplex2D(cq * 2.3) * 0.3 + simplex2D(cq * 5.1) * 0.1);
crumpleN = 1.0 - crumpleN;
float v = mix(0.5, fiberN, ${fiber});
v = mix(v, v * crumpleN, ${crumples});
v = (v - 0.5) * (1.0 + ${contrast}) + 0.5;
v = clamp(v, 0.0, 1.0);
vec3 col = mix(${colorFront}, ${colorBack}, v);
return vec4(col, 1.0);`,
    }
  }
}

register(MaterialNoise)
export default MaterialNoise
