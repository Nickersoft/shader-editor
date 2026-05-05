import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.95, 0.4, 0.6]).describe('Color 1'),
  color2: zColor().default([0.4, 0.7, 0.95]).describe('Color 2'),
  color3: zColor().default([0.95, 0.85, 0.4]).describe('Color 3'),
  color4: zColor().default([0.6, 0.4, 0.9]).describe('Color 4'),
  distortion: zFloat(0, 1).default(0.8).describe('Distortion'),
  swirl: zFloat(0, 1).default(0.1).describe('Swirl'),
  grainMixer: zFloat(0, 1).default(0.0).describe('Grain Mixer'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Mesh Gradient',
  description: 'mesh-gradient — 4 color spots, distortion, swirl',
  color: '#fb7185',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class MeshGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'mesh-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const color3 = this.uniformName('color3')
    const color4 = this.uniformName('color4')
    const distortion = this.uniformName('distortion')
    const swirl = this.uniformName('swirl')
    const grainMixer = this.uniformName('grainMixer')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['rotate2D', 'hash21', 'valueNoise'],
      functions: `
vec2 mgGetPosition(int i, float t) {
  float a = float(i) * 0.37;
  float b = 0.6 + fract(float(i) / 3.0) * 0.9;
  float c = 0.8 + fract(float(i + 1) / 4.0);
  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);
  return 0.5 + 0.5 * vec2(x, y);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 muv = p + 0.5;
vec2 grainUV = muv * 1000.0;
float grain = valueNoise(grainUV);
float mixerGrain = 0.4 * ${grainMixer} * (grain - 0.5);
const float firstFrameOffset = 41.5;
float t = 0.5 * (u_time * ${speed} * 2.0 + firstFrameOffset);
float radius = smoothstep(0.0, 1.0, length(muv - 0.5));
float center = 1.0 - radius;
for (float i = 1.0; i <= 2.0; i++) {
  muv.x += ${distortion} * center / i * sin(t + i * 0.4 * smoothstep(0.0, 1.0, muv.y)) * cos(0.2 * t + i * 2.4 * smoothstep(0.0, 1.0, muv.y));
  muv.y += ${distortion} * center / i * cos(t + i * 2.0 * smoothstep(0.0, 1.0, muv.x));
}
vec2 uvRotated = muv - vec2(0.5);
float angle = 3.0 * ${swirl} * radius;
uvRotated = rotate2D(uvRotated, -angle);
uvRotated += vec2(0.5);
vec3 cols[4];
cols[0] = ${color1};
cols[1] = ${color2};
cols[2] = ${color3};
cols[3] = ${color4};
vec3 color = vec3(0.0);
float totalWeight = 0.0;
for (int i = 0; i < 4; i++) {
  vec2 pos = mgGetPosition(i, t) + mixerGrain;
  float dist = pow(length(uvRotated - pos), 3.5);
  float weight = 1.0 / (dist + 1e-3);
  color += cols[i] * weight;
  totalWeight += weight;
}
color /= max(1e-4, totalWeight);
return vec4(color, 1.0);`,
    }
  }
}

register(MeshGradient)
export default MeshGradient
