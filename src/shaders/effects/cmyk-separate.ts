import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zInt } from '@/shaders/core/schemas'

const config = z.object({
  channel: zInt(0, 3).default(0).describe('Channel'),
  mode: zInt(0, 1).default(0).describe('Mode'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'CMYK Separate',
  description: 'Output a single CMYK channel from previous pass',
  color: '#f59e0b',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class CmykSeparate extends EffectNode<Config, Inputs> {
  static readonly typeId = 'cmyk-separate'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const channel = this.uniformName('channel')
    const mode = this.uniformName('mode')
    return {
      main: `
vec3 rgb = texture(u_prevPass, uv).rgb;
float k = 1.0 - max(rgb.r, max(rgb.g, rgb.b));
vec4 cmyk = vec4(0.0);
float denom = max(1.0 - k, 1e-4);
cmyk.x = (1.0 - rgb.r - k) / denom;
cmyk.y = (1.0 - rgb.g - k) / denom;
cmyk.z = (1.0 - rgb.b - k) / denom;
cmyk.w = k;
int ch = ${channel};
float v = ch == 0 ? cmyk.x : ch == 1 ? cmyk.y : ch == 2 ? cmyk.z : cmyk.w;
v = clamp(v, 0.0, 1.0);
if (${mode} == 0) return vec4(v, v, v, 1.0);
vec3 tints[4];
tints[0] = vec3(0.0, 0.7, 0.95);
tints[1] = vec3(0.95, 0.1, 0.5);
tints[2] = vec3(0.95, 0.85, 0.1);
tints[3] = vec3(0.0, 0.0, 0.0);
vec3 tint = tints[0];
if (ch == 1) tint = tints[1];
else if (ch == 2) tint = tints[2];
else if (ch == 3) tint = tints[3];
return vec4(mix(vec3(1.0), tint, v), 1.0);`,
    }
  }
}

register(CmykSeparate)
export default CmykSeparate
