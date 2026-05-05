import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.02, 0.02, 0.05]).describe('Background'),
  colorFront: zColor().default([0.95, 0.85, 0.4]).describe('Foreground'),
  density: zFloat(0, 1).default(0.5).describe('Density'),
  distortion: zFloat(0, 1).default(0.0).describe('Distortion'),
  strokeWidth: zFloat(0, 1).default(0.5).describe('Stroke Width'),
  strokeTaper: zFloat(0, 1).default(0.0).describe('Stroke Taper'),
  strokeCap: zFloat(0, 1).default(0.0).describe('Stroke Cap'),
  noiseAmount: zFloat(0, 1).default(0.0).describe('Noise'),
  noiseFrequency: zFloat(0, 1).default(0.5).describe('Noise Freq'),
  softness: zFloat(0, 1).default(0.0).describe('Softness'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Spiral ',
  description: 'spiral — animated logarithmic spiral (faithful port)',
  color: '#a855f7',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

// Class is `SpiralTile` to avoid clashing with the simpler `Spiral` already in
// textures/spiral.ts. The legacy typeId 'paper-spiral' is preserved verbatim
// for save-file compatibility.
export class SpiralTile extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'spiral-tile'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorFront = this.uniformName('colorFront')
    const density = this.uniformName('density')
    const distortion = this.uniformName('distortion')
    const strokeWidth = this.uniformName('strokeWidth')
    const strokeTaper = this.uniformName('strokeTaper')
    const strokeCap = this.uniformName('strokeCap')
    const noiseAmount = this.uniformName('noiseAmount')
    const noiseFrequency = this.uniformName('noiseFrequency')
    const softness = this.uniformName('softness')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['snoise', 'pi'],
      main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 spUv = 2.0 * p;
float t = u_time * ${speed};
float l = length(spUv);
float density = clamp(${density}, 0.0, 1.0);
l = pow(max(l, 1e-6), density);
float angle = atan(spUv.y, spUv.x) - t;
float angleNormalised = angle / TWO_PI;
angleNormalised += 0.125 * ${noiseAmount} * snoise(16.0 * pow(${noiseFrequency}, 3.0) * spUv);
float offset = l + angleNormalised;
offset -= ${distortion} * (sin(4.0 * l - 0.5 * t) * cos(PI + l + 0.5 * t));
float stripe = fract(offset);
float shape = 2.0 * abs(stripe - 0.5);
float width = 1.0 - clamp(${strokeWidth}, 0.005 * ${strokeTaper}, 1.0);
float wCap = mix(width, (1.0 - stripe) * (1.0 - step(0.5, stripe)), (1.0 - clamp(l, 0.0, 1.0)));
width = mix(width, wCap, ${strokeCap});
width *= (1.0 - clamp(${strokeTaper}, 0.0, 1.0) * l);
float fw = fwidth(offset);
float fwMult = 4.0 - 3.0 * (smoothstep(0.05, 0.4, 2.0 * ${strokeWidth}) * smoothstep(0.05, 0.4, 2.0 * (1.0 - ${strokeWidth})));
float pixelSize = mix(fwMult * fw, fwidth(shape), clamp(fw, 0.0, 1.0));
pixelSize = mix(pixelSize, 0.002, ${strokeCap} * (1.0 - clamp(l, 0.0, 1.0)));
float res = smoothstep(width - pixelSize - ${softness}, width + pixelSize + ${softness}, shape);
vec3 color = mix(${colorBack}, ${colorFront}, res);
return vec4(color, 1.0);`,
    }
  }
}

register(SpiralTile)
export default SpiralTile
