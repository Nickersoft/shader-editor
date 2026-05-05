import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  curvature: zFloat(0, 1).default(0.15).describe('Curvature'),
  scanline: zFloat(0, 1).default(0.4).describe('Scanline'),
  vignette: zFloat(0, 2).default(0.5).describe('Vignette'),
  chroma: zFloat(0, 0.05, 0.001).default(0.003).describe('Chroma Shift'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'CRT Screen',
  description: 'Barrel distortion + scanlines + vignette',
  color: '#22d3ee',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class CrtScreen extends EffectNode<Config, Inputs> {
  static readonly typeId = 'crt-screen'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const curvature = this.uniformName('curvature')
    const scanline = this.uniformName('scanline')
    const vignette = this.uniformName('vignette')
    const chroma = this.uniformName('chroma')
    return {
      main: `
vec2 q = uv - 0.5;
float r2 = dot(q, q);
q *= 1.0 + r2 * ${curvature};
q += 0.5;
if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec4(0.0, 0.0, 0.0, 1.0);
float rch = texture(u_prevPass, q + vec2(${chroma}, 0.0)).r;
float gch = texture(u_prevPass, q).g;
float bch = texture(u_prevPass, q - vec2(${chroma}, 0.0)).b;
vec3 col = vec3(rch, gch, bch);
float scan = 0.5 + 0.5 * cos(q.y * u_resolution.y * 3.14159);
col *= mix(1.0, scan, ${scanline});
float vig = 1.0 - r2 * ${vignette} * 4.0;
col *= clamp(vig, 0.0, 1.0);
return vec4(col, 1.0);`,
    }
  }
}

register(CrtScreen)
export default CrtScreen
