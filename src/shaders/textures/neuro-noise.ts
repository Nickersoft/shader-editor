import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.02, 0.02, 0.05]).describe('Background'),
  colorMid: zColor().default([0.1, 0.3, 0.9]).describe('Mid'),
  colorFront: zColor().default([0.95, 1.0, 0.95]).describe('Front'),
  scale: zFloat(0.1, 6, 0.05).default(1.0).describe('Scale'),
  brightness: zFloat(0, 1).default(0.5).describe('Brightness'),
  contrast: zFloat(0, 1).default(0.4).describe('Contrast'),
  speed: zFloat(0, 4, 0.05).default(0.3).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Neuro Noise',
  description: 'Glowing synaptic web — 15-iteration domain-warped trig fold',
  color: '#22d3ee',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class NeuroNoise extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'neuro-noise'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorMid = this.uniformName('colorMid')
    const colorFront = this.uniformName('colorFront')
    const scale = this.uniformName('scale')
    const brightness = this.uniformName('brightness')
    const contrast = this.uniformName('contrast')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['rotate2D'],
      functions: `
float neuroShape(vec2 nuv, float nt) {
  vec2 sine_acc = vec2(0.0);
  vec2 res = vec2(0.0);
  float scale = 8.0;
  for (int j = 0; j < 15; j++) {
    nuv = rotate2D(nuv, 1.0);
    sine_acc = rotate2D(sine_acc, 1.0);
    vec2 layer = nuv * scale + float(j) + sine_acc - nt;
    sine_acc += sin(layer);
    res += (0.5 + 0.5 * cos(layer)) / scale;
    scale *= 1.2;
  }
  return res.x + res.y;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 shape_uv = p * 13.0 * ${scale};
float t = 0.5 * u_time * ${speed};
float n = neuroShape(shape_uv, t);
n = (1.0 + ${brightness}) * n * n;
n = pow(n, 0.7 + 6.0 * ${contrast});
n = min(1.4, n);
float blend = smoothstep(0.7, 1.4, n);
vec3 blendFront = mix(${colorMid}, ${colorFront}, blend);
float safeNoise = max(n, 0.0);
vec3 color = blendFront * safeNoise;
float opacity = clamp(safeNoise, 0.0, 1.0);
color = color + ${colorBack} * (1.0 - opacity);
return vec4(color, 1.0);`,
    }
  }
}

register(NeuroNoise)
export default NeuroNoise
