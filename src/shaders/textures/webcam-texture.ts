// WebcamTexture — schema mirrors shaders.com/docs/components/webcamtexture.
// Runtime hookup (binding a getUserMedia stream to a sampler2D) is not yet
// wired in the host runtime; the GLSL renders a placeholder card.

import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zBool, zColor } from '@/shaders/core/schemas'

const config = z.object({
  objectFit: z.enum(['cover', 'contain', 'fill', 'scale-down', 'none']).default('cover').describe('Object Fit'),
  mirror: zBool().default(true).describe('Mirror'),
  placeholder: zColor().default([0.08, 0.10, 0.14]).describe('Placeholder Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Webcam Texture',
  description: 'Display a live webcam feed with customizable object-fit modes',
  color: '#10b981',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class WebcamTexture extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'webcam-texture'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const c = this.uniformName('placeholder')
    return { main: `return vec4(${c}, 1.0);` }
  }
}

register(WebcamTexture)
export default WebcamTexture
