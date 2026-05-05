import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  thickness: zFloat(0.1, 8, 0.1).default(1).describe('Thickness'),
  intensity: zFloat(0, 4, 0.05).default(1).describe('Intensity'),
  smooth: zFloat(0, 0.5).default(0.1).describe('Smooth'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Image Edge',
  description: 'Sobel edge detection — use after an image or gradient source',
  color: '#f59e0b',
  category: 'effects',
  defaultBlendMode: 'normal',
  outputKind: 'scalar',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ImageEdge extends EffectNode<Config, Inputs> {
  static readonly typeId = 'image-edge'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const thickness = this.uniformName('thickness')
    const intensity = this.uniformName('intensity')
    const smooth = this.uniformName('smooth')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution * ${thickness};
float tl = luma(texture(u_prevPass, uv + vec2(-texel.x, -texel.y)).rgb);
float tc = luma(texture(u_prevPass, uv + vec2(0.0,     -texel.y)).rgb);
float tr = luma(texture(u_prevPass, uv + vec2( texel.x, -texel.y)).rgb);
float ml = luma(texture(u_prevPass, uv + vec2(-texel.x,  0.0    )).rgb);
float mr = luma(texture(u_prevPass, uv + vec2( texel.x,  0.0    )).rgb);
float bl = luma(texture(u_prevPass, uv + vec2(-texel.x,  texel.y)).rgb);
float bc = luma(texture(u_prevPass, uv + vec2(0.0,      texel.y)).rgb);
float br = luma(texture(u_prevPass, uv + vec2( texel.x,  texel.y)).rgb);
float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
float edge = clamp(length(vec2(gx, gy)) * ${intensity}, 0.0, 1.0);
edge = smoothstep(${smooth}, ${smooth} + 0.1, edge);
return vec4(edge, edge, edge, 1.0);`,
    }
  }
}

register(ImageEdge)
export default ImageEdge
