import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 1, 0.01).default(0.3).describe('Intensity'),
  density: zFloat(1, 50, 0.5).default(10).describe('Density'),
  chromaticAberration: zFloat(0, 1, 0.01).default(0.3).describe('Chromatic Aberration'),
  seed: zFloat(0, 10, 0.1).default(0).describe('Seed'),
  edges: zEdges().default('mirror').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Shatter',
  description: 'Voronoi-cell shatter with chromatic split',
  color: '#22d3ee',
  category: 'interactive',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Shatter extends EffectNode<Config, Inputs> {
  static readonly typeId = 'shatter'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const density = this.uniformName('density')
    const ca = this.uniformName('chromaticAberration')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['hash2', 'applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
vec2 q = uv * ${density};
vec2 cell = floor(q) + ${seed};
float mouseImpact = exp(-distance(uv, u_mouse) * 6.0);
float effIntensity = ${intensity} + mouseImpact * ${intensity};
vec2 offset = (hash2(cell) - 0.5) * 2.0 * effIntensity * 0.1;
float caStrength = ${ca} * 0.02;
vec2 caDir = normalize(offset + vec2(1e-5));
int em = ${edgeMode(this.config.edges)};
float r = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset + caDir * caStrength, em)).r;
vec4 g = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset, em));
float b = unpremultiplyAlpha(applyEdgeHandling(u_prevPass, uv + offset - caDir * caStrength, em)).b;
return vec4(r, g.g, b, g.a);`,
    }
  }
}

register(Shatter)
export default Shatter
