import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1).default(0.5).describe('Intensity'),
  speed: zFloat(0, 2, 0.05).default(0.3).describe('Speed'),
  scale: zFloat(0.1, 5, 0.05).default(1.0).describe('Scale'),
  color1: zColor().default([1.0, 1.0, 1.0]).describe('Color 1'),
  color2: zColor().default([0.5, 0.5, 0.5]).describe('Color 2'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Fog',
  description: 'Drifting volumetric fog',
  color: '#cbd5e1',
  category: 'interactive',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Fog extends EffectNode<Config, Inputs> {
  static readonly typeId = 'fog'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const speed = this.uniformName('speed')
    const scale = this.uniformName('scale')
    const c1 = this.uniformName('color1')
    const c2 = this.uniformName('color2')
    return {
      dependencies: ['fbm', 'simplex2D'],
      main: `
vec2 mouseDrift = (u_mouse - vec2(0.5)) * 0.5;
float n = fbm((uv + mouseDrift) * ${scale} + vec2(u_time * ${speed}, 0.0), 4.0, 2.0, 0.5) * 0.5 + 0.5;
vec3 fog = mix(${c1}, ${c2}, n);
return vec4(mix(base.rgb, fog, n * ${intensity}), base.a);`,
    }
  }
}

register(Fog)
export default Fog
