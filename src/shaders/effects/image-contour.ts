import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  bands: zFloat(1, 32, 1).default(8).describe('Bands'),
  thickness: zFloat(0.01, 1).default(0.3).describe('Thickness'),
  blur: zFloat(0, 2).default(0.5).describe('Blur'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Image Contour',
  description: 'Luminance contour bands — pair with Color Ramp for heatmap/liquid looks',
  color: '#f59e0b',
  category: 'effects',
  defaultBlendMode: 'normal',
  outputKind: 'scalar',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ImageContour extends EffectNode<Config, Inputs> {
  static readonly typeId = 'image-contour'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const bands = this.uniformName('bands')
    const thickness = this.uniformName('thickness')
    const blur = this.uniformName('blur')
    return {
      dependencies: ['luma'],
      main: `
vec4 src = texture(u_prevPass, uv);
float lum = luma(src.rgb);
float band = fract(lum * ${bands});
float fw = fwidth(band) * (1.0 + ${blur} * 8.0);
float line = 1.0 - smoothstep(${thickness} - fw, ${thickness} + fw, abs(band - 0.5) * 2.0);
return vec4(line, line, line, 1.0);`,
    }
  }
}

register(ImageContour)
export default ImageContour
