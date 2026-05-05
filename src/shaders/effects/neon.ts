import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color: zColor().default([0.4, 0.95, 1.0]).describe('Color'),
  thickness: zFloat(0.1, 6, 0.1).default(1.5).describe('Edge Thickness'),
  glow: zFloat(0, 30, 0.5).default(6).describe('Glow Radius'),
  intensity: zFloat(0, 4, 0.05).default(1.5).describe('Intensity'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Neon',
  description: 'Glowing-edges neon effect',
  color: '#facc15',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Neon extends EffectNode<Config, Inputs> {
  static readonly typeId = 'neon'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color = this.uniformName('color')
    const thickness = this.uniformName('thickness')
    const glow = this.uniformName('glow')
    const intensity = this.uniformName('intensity')
    return {
      dependencies: ['luma'],
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 t = texel * ${thickness};
float lc = luma(texture(u_prevPass, uv).rgb);
float l1 = luma(texture(u_prevPass, uv + vec2(t.x, 0.0)).rgb);
float l2 = luma(texture(u_prevPass, uv - vec2(t.x, 0.0)).rgb);
float l3 = luma(texture(u_prevPass, uv + vec2(0.0, t.y)).rgb);
float l4 = luma(texture(u_prevPass, uv - vec2(0.0, t.y)).rgb);
float edge = abs(l1 - l2) + abs(l3 - l4);
vec2 g = texel * ${glow};
vec4 blur = vec4(0.0);
for (int i = -2; i <= 2; i++) {
  for (int j = -2; j <= 2; j++) {
    blur += texture(u_prevPass, uv + g * vec2(float(i), float(j)));
  }
}
blur /= 25.0;
float blurEdge = length(blur.rgb - texture(u_prevPass, uv).rgb);
vec3 col = ${color} * (edge * 6.0 + blurEdge * 1.5) * ${intensity};
return vec4(col, 1.0);`,
    }
  }
}

register(Neon)
export default Neon
