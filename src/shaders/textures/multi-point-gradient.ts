import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zCenter, zColor, zFloat } from '@/shaders/core/schemas'
import type { SpatialControl } from '@/shaders/core/spatial'

const config = z.object({
  colorA: zColor().default([0.28, 0.46, 0.90]).describe('Color A'),
  positionA: zCenter().default([0.2, 0.2]).describe('Position A'),
  colorB: zColor().default([0.77, 0.30, 1.0]).describe('Color B'),
  positionB: zCenter().default([0.8, 0.2]).describe('Position B'),
  colorC: zColor().default([0.10, 0.74, 0.61]).describe('Color C'),
  positionC: zCenter().default([0.2, 0.8]).describe('Position C'),
  colorD: zColor().default([0.97, 0.73, 0.85]).describe('Color D'),
  positionD: zCenter().default([0.8, 0.8]).describe('Position D'),
  colorE: zColor().default([1.0, 0.55, 0.26]).describe('Color E'),
  positionE: zCenter().default([0.5, 0.5]).describe('Position E'),
  smoothness: zFloat(0.1, 8, 0.05).default(2).describe('Smoothness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Multi-Point Gradient',
  description: 'Five color points blended together by proximity',
  color: '#a855f7',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class MultiPointGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'multi-point-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly spatialControls: readonly SpatialControl[] = [
    { kind: 'colorStopVec2', key: 'positionA', color: 'colorA', label: 'Stop A' },
    { kind: 'colorStopVec2', key: 'positionB', color: 'colorB', label: 'Stop B' },
    { kind: 'colorStopVec2', key: 'positionC', color: 'colorC', label: 'Stop C' },
    { kind: 'colorStopVec2', key: 'positionD', color: 'colorD', label: 'Stop D' },
    { kind: 'colorStopVec2', key: 'positionE', color: 'colorE', label: 'Stop E' },
  ]

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const positionA = this.uniformName('positionA')
    const colorB = this.uniformName('colorB')
    const positionB = this.uniformName('positionB')
    const colorC = this.uniformName('colorC')
    const positionC = this.uniformName('positionC')
    const colorD = this.uniformName('colorD')
    const positionD = this.uniformName('positionD')
    const colorE = this.uniformName('colorE')
    const positionE = this.uniformName('positionE')
    const smoothness = this.uniformName('smoothness')
    return {
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = uv * _ar;
float k = max(${smoothness}, 0.05) * 2.0;

vec2 ps[5];
vec3 cs[5];
ps[0] = ${positionA} * _ar; cs[0] = ${colorA};
ps[1] = ${positionB} * _ar; cs[1] = ${colorB};
ps[2] = ${positionC} * _ar; cs[2] = ${colorC};
ps[3] = ${positionD} * _ar; cs[3] = ${colorD};
ps[4] = ${positionE} * _ar; cs[4] = ${colorE};

float ws[5];
float wsum = 0.0;
for (int i = 0; i < 5; i++) {
  float d = max(distance(p, ps[i]), 1e-4);
  float w = 1.0 / pow(d, k);
  ws[i] = w;
  wsum += w;
}
vec3 col = vec3(0.0);
for (int i = 0; i < 5; i++) {
  col += cs[i] * (ws[i] / wsum);
}
return vec4(col, 1.0);`,
    }
  }
}

register(MultiPointGradient)
export default MultiPointGradient
