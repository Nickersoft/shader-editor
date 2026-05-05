import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.05, 0.05, 0.08]).describe('Background'),
  colorFront: zColor().default([0.95, 0.85, 0.4]).describe('Stripe'),
  density: zFloat(0, 1).default(0.5).describe('Density'),
  strokeWidth: zFloat(0, 1).default(0.5).describe('Width'),
  strokeTaper: zFloat(0, 1).default(0.0).describe('Taper'),
  strokeCap: zFloat(0, 1).default(0.0).describe('Cap'),
  distortion: zFloat(0, 1).default(0.0).describe('Distortion'),
  noiseAmount: zFloat(0, 1).default(0.0).describe('Noise'),
  noiseFreq: zFloat(0, 1).default(0.5).describe('Noise Freq'),
  softness: zFloat(0, 1).default(0.0).describe('Softness'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Spiral Stripe',
  description: 'Animated logarithmic spiral stripe mask',
  color: '#a855f7',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SpiralStripe extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'spiral-stripe'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorFront = this.uniformName('colorFront')
    const density = this.uniformName('density')
    const strokeWidth = this.uniformName('strokeWidth')
    const strokeTaper = this.uniformName('strokeTaper')
    const strokeCap = this.uniformName('strokeCap')
    const distortion = this.uniformName('distortion')
    const noiseAmount = this.uniformName('noiseAmount')
    const noiseFreq = this.uniformName('noiseFreq')
    const softness = this.uniformName('softness')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['snoise'],
      functions: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979323846
#endif`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 spUv = 2.0 * p;
float t = u_time * ${speed};
float l = length(spUv);
float density = clamp(${density}, 0.0, 1.0);
l = pow(max(l, 1e-6), density);
float angle = atan(spUv.y, spUv.x) - t;
float angleNorm = angle / TWO_PI;
angleNorm += 0.125 * ${noiseAmount} * snoise(16.0 * pow(${noiseFreq}, 3.0) * spUv);
float offset = l + angleNorm;
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

register(SpiralStripe)
export default SpiralStripe
