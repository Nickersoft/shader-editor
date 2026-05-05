import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(8)
    .default({
      values: [
        [0.88, 0.91, 1.0, 1],
        [0.14, 0.11, 0.6, 1],
        [0.97, 0.31, 0.57, 1],
        [0.62, 0.31, 0.83, 1],
      ],
      length: 4,
    } satisfies Palette)
    .describe('Colors'),
  falloff: zFloat(0.5, 8, 0.05).default(3.5).describe('Falloff'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  amplitude: zFloat(0, 0.6).default(0.4).describe('Motion'),
  seed: zFloat(0, 100, 0.1).default(0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Mesh Spots',
  description:
    'Soft animated color blobs blended into a smooth mesh — use with Organic Warp',
  color: '#fb7185',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class MeshSpotsGradient extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'mesh-spots-gradient'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const falloff = this.uniformName('falloff')
    const speed = this.uniformName('speed')
    const amplitude = this.uniformName('amplitude')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['hash21'],
      functions: `
vec2 msgSpotPos(int i, float t, float amp, float seed) {
  float fi = float(i) + seed;
  float a = fi * 0.37;
  float bx = 0.6 + fract(fi / 3.0) * 0.9;
  float by = 0.8 + fract((fi + 1.0) / 4.0);
  float x = sin(t * bx + a);
  float y = cos(t * by + a * 1.5);
  return 0.5 + amp * vec2(x, y);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar + 0.5;
float t = 0.5 * u_time * ${speed};
int n = max(${colors}_count, 1);
vec3 color = vec3(0.0);
float totalWeight = 0.0;
for (int i = 0; i < 8; i++) {
  if (i >= n) break;
  vec2 pos = msgSpotPos(i, t, ${amplitude}, ${seed});
  float dist = pow(length(p - pos), ${falloff});
  float w = 1.0 / (dist + 1e-3);
  color += ${colors}[i].rgb * w;
  totalWeight += w;
}
color /= max(totalWeight, 1e-4);
return vec4(color, 1.0);`,
    }
  }
}

register(MeshSpotsGradient)
export default MeshSpotsGradient
