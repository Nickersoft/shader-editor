import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  distortion: zFloat(0, 1).default(0.5).describe('Distortion'),
  swirl: zFloat(0, 1).default(0.2).describe('Swirl'),
  scale: zFloat(0.1, 4, 0.05).default(1.0).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  centerFalloff: zFloat(0, 1).default(0.0).describe('Center Falloff'),
  iterations: zInt(1, 4).default(2).describe('Iterations'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Organic Warp',
  description: 'Broad liquid UV distortion — stack over a gradient or noise source',
  color: '#34d399',
  category: 'distortion',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class OrganicWarp extends EffectNode<Config, Inputs> {
  static readonly typeId = 'organic-warp'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const distortion = this.uniformName('distortion')
    const swirl = this.uniformName('swirl')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    const centerFalloff = this.uniformName('centerFalloff')
    const iterations = this.uniformName('iterations')
    return {
      dependencies: ['rotate2D'],
      functions: `
vec2 owNoise(vec2 p, float t) {
  float sx = sin(t + p.x * 1.4 * p.y + t);
  float sy = cos(t + p.y * 1.4 * p.x);
  return vec2(sx, sy);
}`,
      main: `
vec2 q = uv;
float t = u_time * ${speed};
float radius = length((uv - 0.5) * 2.0);
float centerMask = mix(1.0, max(0.0, radius), ${centerFalloff});
vec2 warpUv = (uv - 0.5) * ${scale};
for (int i = 0; i < 4; i++) {
  if (i >= ${iterations}) break;
  float fi = float(i + 1);
  vec2 offset = owNoise(warpUv, t);
  q += ${distortion} * centerMask / fi
    * vec2(offset.x * sin(t + fi * 0.4 * q.y), offset.y * cos(t + fi * 2.0 * q.x))
    * 0.15;
}
vec2 swUv = q - 0.5;
float angle = 3.0 * ${swirl} * length(swUv * 2.0);
swUv = rotate2D(swUv, -angle);
q = swUv + 0.5;
return texture(u_prevPass, q);`,
    }
  }
}

register(OrganicWarp)
export default OrganicWarp
