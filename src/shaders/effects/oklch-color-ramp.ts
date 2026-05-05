import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zBool, zFloat, zInt, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(10)
    .default({
      values: [
        [0.02, 0.05, 0.14, 1],
        [0.08, 0.35, 0.72, 1],
        [0.95, 0.45, 0.12, 1],
        [1.0, 0.95, 0.75, 1],
      ],
      length: 4,
    } satisfies Palette)
    .describe('Colors'),
  channel: zInt(0, 4).default(0).describe('Channel'),
  steps: zInt(0, 16).default(0).describe('Steps'),
  stepsPerColor: zInt(1, 10).default(1).describe('Steps/Color'),
  softness: zFloat(0, 1).default(0.5).describe('Softness'),
  wrap: zBool().default(false).describe('Wrap'),
  domainMin: zFloat(0, 1).default(0).describe('Domain Min'),
  domainMax: zFloat(0, 1).default(1).describe('Domain Max'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'OKLCH Color Ramp',
  description: 'Map a scalar through an N-stop perceptual Paper-style palette',
  color: '#f59e0b',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class OklchColorRamp extends EffectNode<Config, Inputs> {
  static readonly typeId = 'oklch-color-ramp'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const channel = this.uniformName('channel')
    const steps = this.uniformName('steps')
    const stepsPerColor = this.uniformName('stepsPerColor')
    const softness = this.uniformName('softness')
    const wrap = this.uniformName('wrap')
    const dMin = this.uniformName('domainMin')
    const dMax = this.uniformName('domainMax')
    return {
      dependencies: ['luma', 'oklchColorRampLookup'],
      main: `
vec4 src = texture(u_prevPass, uv);
float scalar;
int ch = ${channel};
if (ch == 0) scalar = luma(src.rgb);
else if (ch == 1) scalar = src.r;
else if (ch == 2) scalar = src.g;
else if (ch == 3) scalar = src.b;
else scalar = src.a;
float span = max(${dMax} - ${dMin}, 1e-4);
float t = clamp((scalar - ${dMin}) / span, 0.0, 1.0);
return oklchColorRampLookup(t, ${colors}, ${colors}_count, ${steps}, ${softness}, ${stepsPerColor}, ${wrap});`,
    }
  }
}

register(OklchColorRamp)
export default OklchColorRamp
