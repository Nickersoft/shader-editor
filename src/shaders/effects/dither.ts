import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  levels: zFloat(2, 16, 1).default(4).describe('Levels'),
  pixelSize: zFloat(1, 12, 1).default(2).describe('Pixel Size'),
  colorDark: zColor().default([0.05, 0.05, 0.1]).describe('Dark'),
  colorLight: zColor().default([1, 1, 0.95]).describe('Light'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Dither',
  description: '4×4 Bayer ordered dither (2-color)',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Dither extends EffectNode<Config, Inputs> {
  static readonly typeId = 'dither'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const levels = this.uniformName('levels')
    const pixelSize = this.uniformName('pixelSize')
    const colorDark = this.uniformName('colorDark')
    const colorLight = this.uniformName('colorLight')
    return {
      dependencies: ['luma'],
      functions: `
const float bayer4[16] = float[16](
  0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
 12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
  3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
 15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
);`,
      main: `
vec2 px = floor(uv * u_resolution / max(${pixelSize}, 1.0)) * max(${pixelSize}, 1.0) / u_resolution;
float lum = luma(texture(u_prevPass, px).rgb);
ivec2 ipx = ivec2(mod(uv * u_resolution / max(${pixelSize}, 1.0), 4.0));
float t = bayer4[ipx.y * 4 + ipx.x];
float q = floor(lum * ${levels} + t) / ${levels};
return vec4(mix(${colorDark}, ${colorLight}, clamp(q, 0.0, 1.0)), 1.0);`,
    }
  }
}

register(Dither)
export default Dither
