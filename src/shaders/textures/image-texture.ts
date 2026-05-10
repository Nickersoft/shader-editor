import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { noImage, zColorRgba, zImageInput } from '@/shaders/core/schemas'

const config = z.object({
  tint: zColorRgba().default([1, 1, 1, 1]).describe('Tint'),
})

const inputs = z.object({
  image: zImageInput().default(noImage).describe('Image'),
})

const meta: NodeMeta = {
  name: 'Image Texture',
  description: 'Sample an uploaded image as a texture',
  color: '#3b82f6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ImageTexture extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'image-texture'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const image = this.uniformName('image')
    const tint = this.uniformName('tint')
    return {
      dependencies: ['applySizing'],
      main: `
vec2 sampleUv = applySizing(uv, ${image}_meta, ${image}_offset);
if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
  return vec4(0.0);
}
vec4 src = texture(${image}, sampleUv);
return src * ${tint};`,
    }
  }
}

register(ImageTexture)
export default ImageTexture
