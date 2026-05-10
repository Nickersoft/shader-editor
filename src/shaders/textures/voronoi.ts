import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorA: zColor().default([0.19, 0.53, 0.81]).describe('Color A'),
  colorB: zColor().default([0.99, 0.01, 0.87]).describe('Color B'),
  colorBorder: zColor().default([0, 0, 0]).describe('Border Color'),
  scale: zFloat(0.5, 30, 0.1).default(6).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  seed: zFloat(0, 100, 0.1).default(0).describe('Seed'),
  edgeIntensity: zFloat(0, 1).default(0.5).describe('Edge Intensity'),
  edgeSoftness: zFloat(0, 0.5, 0.005).default(0.05).describe('Edge Softness'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Voronoi',
  description: 'Cellular pattern shaded by distance to nearest scattered point',
  color: '#06b6d4',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Voronoi extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'voronoi'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorA = this.uniformName('colorA')
    const colorB = this.uniformName('colorB')
    const colorBorder = this.uniformName('colorBorder')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    const seed = this.uniformName('seed')
    const edgeIntensity = this.uniformName('edgeIntensity')
    const edgeSoftness = this.uniformName('edgeSoftness')
    return {
      dependencies: ['hash22'],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 scaledUV = vec2(uv.x * aspect, uv.y) * ${scale};
vec2 cell = floor(scaledUV);
vec2 localUV = fract(scaledUV);
float t = u_time * ${speed};
float d1 = 10.0;
float d2 = 10.0;
for (int ny = -1; ny <= 1; ny++) {
  for (int nx = -1; nx <= 1; nx++) {
    vec2 off = vec2(float(nx), float(ny));
    vec2 h = hash22(cell + off + ${seed});
    float px = clamp(h.x + sin(t + h.x * 6.28) * 0.15, 0.05, 0.95);
    float py = clamp(h.y + cos(t * 0.7 + h.y * 6.28) * 0.15, 0.05, 0.95);
    float d = length(localUV - (off + vec2(px, py)));
    if (d < d1) { d2 = d1; d1 = d; }
    else if (d < d2) { d2 = d; }
  }
}
float safeSum = max(d1 + d2, 1e-4);
float fillT = clamp(d1 * 2.0 / safeSum, 0.0, 1.0);
fillT = pow(fillT, 4.0 - ${edgeIntensity} * 3.0);
vec3 cellColor = mix(${colorA}, ${colorB}, clamp(fillT, 0.0, 1.0));
float scaledEdge = ${edgeSoftness} * ${scale} / 6.0;
float edgeMetric = (d2 - d1) / safeSum;
float edgeMask = smoothstep(0.0, scaledEdge + 0.001, edgeMetric);
vec3 col = mix(${colorBorder}, cellColor, edgeMask);
return vec4(col, 1.0);`,
    }
  }
}

register(Voronoi)
export default Voronoi
