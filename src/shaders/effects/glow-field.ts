import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([1.0, 0.9, 0.6]).describe('Glow Color'),
  radius: zFloat(0.5, 40, 0.5).default(8).describe('Radius'),
  intensity: zFloat(0, 4, 0.05).default(1.2).describe('Intensity'),
  threshold: zFloat(0, 1).default(0.3).describe('Threshold'),
  composite: zFloat(0, 1).default(1).describe('Composite'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Glow Field',
  description: 'Additive bloom glow — use after god-rays, neuro-noise, or any bright source',
  color: '#fbbf24',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class GlowField extends EffectNode<Config, Inputs> {
  static readonly typeId = 'glow-field'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const radius = this.uniformName('radius')
    const intensity = this.uniformName('intensity')
    const threshold = this.uniformName('threshold')
    const composite = this.uniformName('composite')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 r = texel * ${radius};
vec3 glow = vec3(0.0);
const int N = 4;
float total = 0.0;
for (int i = -N; i <= N; i++) {
  for (int j = -N; j <= N; j++) {
    vec3 c = texture(u_prevPass, uv + r * vec2(float(i), float(j))).rgb;
    float w = exp(-0.5 * float(i * i + j * j) / float(N * N));
    float bright = max(luma(c) - ${threshold}, 0.0);
    glow += c * bright * w;
    total += w;
  }
}
glow = glow / max(total, 1e-4) * ${intensity};
vec4 src = texture(u_prevPass, uv);
vec3 col = src.rgb + ${color} * glow;
col = mix(src.rgb, col, ${composite});
return vec4(col, src.a);`,
    }
  }
}

register(GlowField)
export default GlowField
