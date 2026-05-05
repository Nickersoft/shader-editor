import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  cells: zFloat(8, 300, 1).default(80).describe('Cells'),
  colorBack: zColor().default([0, 0, 0]).describe('Background'),
  colorChar: zColor().default([0.4, 1, 0.5]).describe('Character'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'ASCII',
  description: 'Coarse ASCII-like dot density',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Ascii extends EffectNode<Config, Inputs> {
  static readonly typeId = 'ascii'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const cellsU = this.uniformName('cells')
    const colorBack = this.uniformName('colorBack')
    const colorChar = this.uniformName('colorChar')
    return {
      dependencies: ['luma'],
      main: `
vec2 cells = vec2(${cellsU}, ${cellsU} * (u_resolution.y / max(u_resolution.x, 1.0)));
vec2 cellId = floor(uv * cells);
vec2 cellUv = fract(uv * cells);
vec2 cellSample = (cellId + 0.5) / cells;
float lum = luma(texture(u_prevPass, cellSample).rgb);
float bars = floor(lum * 4.0);
float fill = step(cellUv.y, bars * 0.25 + 0.05);
float bar  = step(abs(cellUv.x - 0.5), 0.4) * fill;
return vec4(mix(${colorBack}, ${colorChar}, bar), 1.0);`,
    }
  }
}

register(Ascii)
export default Ascii
