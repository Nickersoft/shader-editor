import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat } from '@/shaders/core/schemas'

const config = z.object({
  intensity: zFloat(0, 2, 0.01).default(0.5).describe('Intensity'),
  seed: zFloat(0, 1, 0.01).default(0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Diffuse Blur',
  description: 'Random-jitter blur (painterly softness)',
  color: '#94a3b8',
  category: 'blurs',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DiffuseBlur extends EffectNode<Config, Inputs> {
  static readonly typeId = 'diffuse-blur'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const intensity = this.uniformName('intensity')
    const seed = this.uniformName('seed')
    return {
      main: `
vec2 texel = 1.0 / u_resolution;
vec2 jitter = vec2(
  sin(dot(uv * 50.0 + ${seed}, vec2(12.9898, 78.233))),
  sin(dot(uv * 50.0 + ${seed} + 1.0, vec2(39.346, 11.135)))
);
vec2 offset = jitter * ${intensity} * texel * 50.0;
return texture(u_prevPass, clamp(uv + offset, 0.0, 1.0));`,
    }
  }
}

register(DiffuseBlur)
export default DiffuseBlur
