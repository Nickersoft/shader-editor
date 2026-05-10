import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node.svelte'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  length: zFloat(0, 1, 0.01).default(0.3).describe('Length'),
  width: zFloat(0, 0.5, 0.005).default(0.05).describe('Width'),
  color: zColor().default([1.0, 0.9, 0.4]).describe('Color'),
  intensity: zFloat(0, 1).default(0.5).describe('Intensity'),
  fade: zFloat(0.5, 0.99, 0.005).default(0.92).describe('Fade'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Cursor Trail',
  description: 'Glowing curved trail from a center point',
  color: '#facc15',
  category: 'interactive',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class CursorTrail extends EffectNode<Config, Inputs> {
  static readonly typeId = 'cursor-trail'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta
  static readonly scope = 'scene' as const

  glsl(): GlslBlock {
    const len = this.uniformName('length')
    const width = this.uniformName('width')
    const color = this.uniformName('color')
    const intensity = this.uniformName('intensity')
    const fade = this.uniformName('fade')
    return {
      main: `
vec4 src = texture(u_prevPass, uv);
vec4 prev = texture(u_prevFrame, uv);
float aspect = u_resolution.x / max(u_resolution.y, 1.0);
vec2 aspectUV = vec2(uv.x * aspect, uv.y);
vec2 cursorPos = vec2(u_mouse.x * aspect, u_mouse.y);
vec2 mouseVec = vec2(u_mouseDelta.x * aspect, u_mouseDelta.y);
float headDist = length(aspectUV - cursorPos);
float head = 1.0 - smoothstep(0.0, max(${width}, 1e-4), headDist);
float trailLen = length(mouseVec) * 100.0 * ${len};
vec2 backTrail = cursorPos - normalize(mouseVec + vec2(1e-5)) * trailLen;
float backDist = length(aspectUV - backTrail);
float trail = 1.0 - smoothstep(0.0, max(${width} * 1.5, 1e-4), backDist);
float emit = max(head, trail * 0.5) * ${intensity};
vec3 painted = ${color} * emit;
vec3 faded = prev.rgb * ${fade};
vec3 trailRgb = max(faded, painted);
return vec4(src.rgb + trailRgb, max(src.a, max(prev.a * ${fade}, emit)));`,
    }
  }
}

register(CursorTrail)
export default CursorTrail
