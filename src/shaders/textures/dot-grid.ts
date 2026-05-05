import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.05, 0.05, 0.08]).describe('Background'),
  colorFill: zColor().default([0.95, 0.9, 0.7]).describe('Fill'),
  colorStroke: zColor().default([1.0, 0.7, 0.3]).describe('Stroke'),
  gapX: zFloat(4, 200, 1).default(30.0).describe('Gap X'),
  gapY: zFloat(4, 200, 1).default(30.0).describe('Gap Y'),
  dotSize: zFloat(0.05, 0.95).default(0.3).describe('Dot Size'),
  strokeWidth: zFloat(0, 0.2, 0.005).default(0).describe('Stroke'),
  sizeRange: zFloat(0, 0.5).default(0).describe('Size Rand'),
  opacityRange: zFloat(0, 1).default(0).describe('Opacity Rand'),
  shape: zInt(0, 3).default(0).describe('Shape (0=circle 1=sq 2=diamond 3=cross)'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Dot Grid',
  description:
    'Grid of geometric dots — circle, square, diamond, or cross with optional per-cell size/opacity randomization',
  color: '#0ea5e9',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DotGrid extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'dot-grid'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorFill = this.uniformName('colorFill')
    const colorStroke = this.uniformName('colorStroke')
    const gapX = this.uniformName('gapX')
    const gapY = this.uniformName('gapY')
    const dotSize = this.uniformName('dotSize')
    const strokeWidth = this.uniformName('strokeWidth')
    const sizeRange = this.uniformName('sizeRange')
    const opacityRange = this.uniformName('opacityRange')
    const shape = this.uniformName('shape')
    return {
      dependencies: ['hash21'],
      main: `
vec2 px = uv * u_resolution;
vec2 cellSize = vec2(${gapX}, ${gapY});
vec2 cellId = floor(px / cellSize);
vec2 cellUv = (px - cellId * cellSize) / cellSize - 0.5;
float rnd = hash21(cellId);
float sz = ${dotSize} + (rnd - 0.5) * ${sizeRange};
sz = clamp(sz, 0.01, 0.99);
float opRand = 1.0 - rnd * ${opacityRange};
cellUv.x *= cellSize.x / cellSize.y;
float d;
int sh = ${shape};
if (sh == 1) {
  vec2 q = abs(cellUv);
  d = max(q.x, q.y) - sz * 0.5;
} else if (sh == 2) {
  d = (abs(cellUv.x) + abs(cellUv.y)) - sz * 0.5;
} else if (sh == 3) {
  float arm = sz * 0.15;
  float len = sz * 0.5;
  float h = max(abs(cellUv.x) - len, abs(cellUv.y) - arm);
  float v2 = max(abs(cellUv.y) - len, abs(cellUv.x) - arm);
  d = min(h, v2);
} else {
  d = length(cellUv) - sz * 0.5;
}
float aa = fwidth(d);
float fill = 1.0 - smoothstep(-aa, aa, d);
float stroke = smoothstep(-(${strokeWidth} + aa), -(${strokeWidth} - aa), d) * fill;
vec3 col = ${colorBack};
col = mix(col, ${colorFill}, fill * opRand);
col = mix(col, ${colorStroke}, stroke * opRand);
return vec4(col, 1.0);`,
    }
  }
}

register(DotGrid)
export default DotGrid
