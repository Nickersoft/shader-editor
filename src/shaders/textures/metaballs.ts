import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(8)
    .default({
      values: [
        [0.95, 0.4, 0.6, 1],
        [0.4, 0.6, 1.0, 1],
        [0.95, 0.85, 0.3, 1],
        [0.5, 0.95, 0.7, 1],
      ],
      length: 4,
    } satisfies Palette)
    .describe('Colors'),
  colorBack: zColor().default([0.04, 0.04, 0.08]).describe('Background'),
  count: zInt(1, 20).default(6).describe('Count'),
  size: zFloat(0.0, 1).default(0.5).describe('Size'),
  softness: zFloat(0, 0.3, 0.005).default(0.0).describe('Softness'),
  speed: zFloat(0, 4, 0.05).default(1.0).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Metaballs',
  description: 'Gooey blobs that smoothly merge — per-ball palette colour',
  color: '#f472b6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class Metaballs extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'metaballs'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const colorBack = this.uniformName('colorBack')
    const count = this.uniformName('count')
    const size = this.uniformName('size')
    const softness = this.uniformName('softness')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash21'],
      functions: `
float mbNoise1D(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash21(vec2(i, 0.0)), hash21(vec2(i + 1.0, 0.0)), u);
}
float mbBallShape(vec2 uv, vec2 c, float p) {
  float s = 0.5 * length(uv - c);
  s = 1.0 - clamp(s, 0.0, 1.0);
  return pow(s, p);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 shape_uv = (uv - 0.5) * _ar + 0.5;
float t = 0.2 * u_time * ${speed};
int n = max(${colors}_count, 1);
int count = clamp(${count}, 1, 20);
float size = clamp(${size}, 0.0, 1.0);
float p_exp = 45.0 - 30.0 * size;
vec3 totalColor = vec3(0.0);
float totalShape = 0.0;
for (int i = 0; i < 20; i++) {
  if (i >= count) break;
  float idxFract = float(i) / 20.0;
  float angle = 6.28318 * idxFract;
  float speed = 1.0 - 0.2 * idxFract;
  float noiseX = mbNoise1D(angle * 10.0 + float(i) + t * speed);
  float noiseY = mbNoise1D(angle * 20.0 + float(i) - t * speed);
  vec2 pos = vec2(0.5) + 1e-4 + 0.9 * (vec2(noiseX, noiseY) - 0.5);
  int ci = i - (i / n) * n;
  vec3 ballCol = ${colors}[ci % 8].rgb;
  float shape = mbBallShape(shape_uv, pos, p_exp);
  shape *= pow(size, 0.2);
  shape = smoothstep(0.0, 1.0, shape);
  totalColor += ballCol * shape;
  totalShape += shape;
}
totalColor /= max(totalShape, 1e-4);
float edge = max(${softness}, fwidth(totalShape));
float k = smoothstep(0.4, 0.4 + edge, totalShape);
vec3 col = mix(${colorBack}, totalColor, k);
return vec4(col, 1.0);`,
    }
  }
}

register(Metaballs)
export default Metaballs
