import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(10)
    .default({
      values: [
        [0.95, 0.4, 0.6, 1],
        [0.4, 0.7, 1.0, 1],
        [0.95, 0.85, 0.3, 1],
        [0.5, 0.95, 0.7, 1],
      ],
      length: 4,
    } satisfies Palette)
    .describe('Colors'),
  colorBack: zColor().default([0.04, 0.04, 0.08]).describe('Background'),
  cells: zFloat(2, 60, 1).default(12.0).describe('Cells'),
  size: zFloat(0.02, 1).default(0.35).describe('Dot Size'),
  sizeRange: zFloat(0, 1).default(0.3).describe('Size Range'),
  spread: zFloat(0, 1).default(0.4).describe('Spread'),
  softness: zFloat(0, 0.5, 0.005).default(0.04).describe('Softness'),
  stepsPerColor: zInt(1, 4).default(1).describe('Steps/Color'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Dot Orbit',
  description: 'Grid of dots orbiting their cell centres with palette colours',
  color: '#fb923c',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class DotOrbit extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'dot-orbit'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const colorBack = this.uniformName('colorBack')
    const cells = this.uniformName('cells')
    const size = this.uniformName('size')
    const sizeRange = this.uniformName('sizeRange')
    const spread = this.uniformName('spread')
    const softness = this.uniformName('softness')
    const stepsPerColor = this.uniformName('stepsPerColor')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash22', 'hash21', 'rotate2D'],
      functions: `
vec3 doVoronoiShape(vec2 uv, float t, float spreading) {
  vec2 i_uv = floor(uv);
  vec2 f_uv = fract(uv);
  float minDist = 1.0;
  vec2 randomizer = vec2(0.0);
  float s = 0.25 * clamp(spreading, 0.0, 1.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 tile = vec2(float(x), float(y));
      vec2 rand = hash22(i_uv + tile);
      vec2 c = vec2(0.5 + 1e-4);
      c += s * cos(t + 6.28318 * rand);
      c -= 0.5;
      c = rotate2D(c, hash21(rand) + 0.1 * t);
      c += 0.5;
      float d = length(tile + c - f_uv);
      if (d < minDist) {
        minDist = d;
        randomizer = rand;
      }
    }
  }
  return vec3(minDist, randomizer);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 shape_uv = (uv - 0.5) * _ar * ${cells} * 0.5 + 0.5;
float t = u_time * ${speed} + 1e-4;
vec3 vor = doVoronoiShape(shape_uv, t, ${spread});
float radius = 0.25 * clamp(${size}, 0.0, 1.0) - 0.5 * clamp(${sizeRange}, 0.0, 1.0) * vor.z;
float dist = vor.x;
float edge = max(${softness}, fwidth(dist));
float dotMask = 1.0 - smoothstep(radius - edge, radius + edge, dist);
int n = max(${colors}_count, 1);
float spc = float(max(${stepsPerColor}, 1));
float mixer = (vor.y - 0.5 / float(n)) * float(n);
vec4 grad = ${colors}[0];
for (int i = 1; i < 10; i++) {
  if (i >= n) break;
  float localT = clamp(mixer - float(i - 1), 0.0, 1.0);
  localT = floor(localT * spc + 0.5) / spc;
  grad = mix(grad, ${colors}[i % 10], localT);
}
vec3 col = mix(${colorBack}, grad.rgb, dotMask);
return vec4(col, 1.0);`,
    }
  }
}

register(DotOrbit)
export default DotOrbit
