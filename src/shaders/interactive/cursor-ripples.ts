import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { edgeMode, zCenterAxis, zEdges, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  frequency: zFloat(1, 30, 0.1).default(10).describe('Frequency'),
  speed: zFloat(0, 5, 0.05).default(1.0).describe('Speed'),
  intensity: zFloat(0, 1).default(0.3).describe('Intensity'),
  decay: zFloat(0, 2, 0.05).default(0.5).describe('Decay'),
  edges: zEdges().default('stretch').describe('Edges'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Cursor Ripples',
  description: 'Concentric ripples emanating from a center point',
  color: '#22d3ee',
  category: 'interactive',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class CursorRipples extends EffectNode<Config, Inputs> {
  static readonly typeId = 'cursor-ripples'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly scope = 'scene' as const

  glsl(): GlslBlock {
    const frequency = this.uniformName('frequency')
    const speed = this.uniformName('speed')
    const intensity = this.uniformName('intensity')
    const decay = this.uniformName('decay')
    return {
      dependencies: ['applyEdgeHandling', 'unpremultiplyAlpha'],
      main: `
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 cursorPos = vec2(u_mouse.x * aspect, u_mouse.y);
vec2 p = aspectUV - cursorPos;
float r = length(p);
float wave = sin(r * ${frequency} - u_time * ${speed}) * exp(-r * ${decay}) * ${intensity};
vec2 dir = (r > 1e-5) ? (p / r) : vec2(0.0);
vec2 finalUV = uv + dir * wave * 0.05;
return unpremultiplyAlpha(applyEdgeHandling(u_prevPass, finalUV, ${edgeMode(this.config.edges)}));`,
    }
  }
}

register(CursorRipples)
export default CursorRipples
