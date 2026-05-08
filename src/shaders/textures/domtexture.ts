// DOMTexture — schema mirrors shaders.com/docs/components/domtexture.
// Reference labels this experimental (Chrome Canary + chrome://flags
// canvas-draw-element). Runtime support not yet wired; renders a placeholder.

import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor } from '@/shaders/core/schemas'

const config = z.object({
  placeholder: zColor().default([0.4, 0.4, 0.45]).describe('Placeholder Color'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'DOM Texture',
  description: 'Render live HTML/DOM content as a WebGPU texture layer (experimental)',
  color: '#64748b',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DomTexture extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'dom-texture'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const c = this.uniformName('placeholder')
    return { main: `return vec4(${c}, 1.0);` }
  }
}

register(DomTexture)
export default DomTexture
