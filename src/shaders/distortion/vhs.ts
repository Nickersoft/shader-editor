import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  chroma: zFloat(0, 0.05, 0.001).default(0.006).describe('Chroma Shift'),
  scanline: zFloat(0, 1).default(0.3).describe('Scanline'),
  tracking: zFloat(0, 0.3, 0.005).default(0.02).describe('Tracking'),
  speed: zFloat(0, 4, 0.05).default(1.0).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'VHS',
  description: 'Tape-like chroma + scanlines + tracking',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Vhs extends EffectNode<Config, Inputs> {
  static readonly typeId = 'vhs'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const chroma = this.uniformName('chroma')
    const scanline = this.uniformName('scanline')
    const tracking = this.uniformName('tracking')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash'],
      main: `
float t = u_time * ${speed};
float roll = sin(uv.y * 200.0 + t * 4.0);
vec2 q = vec2(uv.x + roll * ${tracking} * 0.05, uv.y);
float r = texture(u_prevPass, q + vec2(${chroma}, 0.0)).r;
float g = texture(u_prevPass, q).g;
float b = texture(u_prevPass, q - vec2(${chroma}, 0.0)).b;
vec3 col = vec3(r, g, b);
float scan = 0.5 + 0.5 * cos(uv.y * u_resolution.y * 3.14159);
col *= mix(1.0, scan, ${scanline});
col += (hash(uv * u_resolution + t) - 0.5) * 0.05;
return vec4(col, 1.0);`,
    }
  }
}

register(Vhs)
export default Vhs
