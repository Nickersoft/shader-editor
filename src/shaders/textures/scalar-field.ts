import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zFloat, zInt } from '@/shaders/core/schemas'

const config = z.object({
  mode: zInt(0, 8).default(0).describe('Mode'),
  scale: zFloat(0.1, 30, 0.1).default(3.0).describe('Scale'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
  octaves: zFloat(1, 8, 1).default(5.0).describe('Octaves'),
  persistence: zFloat(0.1, 1).default(0.5).describe('Persistence'),
  lacunarity: zFloat(1.1, 4, 0.1).default(2.0).describe('Lacunarity'),
  contrast: zFloat(0.1, 4, 0.05).default(1.0).describe('Contrast'),
  brightness: zFloat(-1, 1).default(0.0).describe('Brightness'),
  seed: zFloat(0, 100, 0.1).default(0.0).describe('Seed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Scalar Field',
  description: 'Grayscale procedural field for driving color ramps and masks',
  color: '#94a3b8',
  category: 'textures',
  defaultBlendMode: 'normal',
  outputKind: 'scalar',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ScalarField extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'scalar-field'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const mode = this.uniformName('mode')
    const scale = this.uniformName('scale')
    const speed = this.uniformName('speed')
    const octaves = this.uniformName('octaves')
    const persistence = this.uniformName('persistence')
    const lacunarity = this.uniformName('lacunarity')
    const contrast = this.uniformName('contrast')
    const brightness = this.uniformName('brightness')
    const seed = this.uniformName('seed')
    return {
      dependencies: ['simplex2D'],
      functions: `
float sfFbm(vec2 p, float oct, float lac, float per) {
  float sum = 0.0, amp = 1.0, freq = 1.0, mx = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= oct) break;
    sum += amp * simplex2D(p * freq);
    mx += amp; amp *= per; freq *= lac;
  }
  return sum / max(mx, 1e-4);
}
float sfTendrils(vec2 p, float t) {
  float scaleMul = 1.0, sineAcc = 0.0;
  for (int i = 0; i < 15; i++) {
    p = vec2(p.x + sin(p.y + t), p.y + cos(p.x + t * 1.3));
    p *= 1.2; scaleMul *= 1.2;
    sineAcc += abs(sin(p.x * 0.5)) + abs(cos(p.y * 0.5));
  }
  return sineAcc / 30.0;
}
float sfRings(vec2 p, float t) {
  float r = length(p);
  return sin(r * 20.0 - t * 3.0) * 0.5 + 0.5;
}
float sfWaves(vec2 p, float t) {
  return sin(p.x * 10.0 + t) * 0.5 + 0.5;
}
float sfRipples(vec2 p, float t) {
  float r = length(p);
  float v = sin(r * 30.0 - t * 4.0) * exp(-r * 3.0);
  return v * 0.5 + 0.5;
}
float sfBlobs(vec2 p, float t) {
  float v = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(t * (0.3 + fi * 0.17) + fi * 0.37) * 0.4,
                  cos(t * (0.4 + fi * 0.13) + fi * 0.53) * 0.4);
    float d = length(p - c);
    v += 0.08 / (d * d + 0.01);
  }
  return clamp(v, 0.0, 1.0);
}
float sfSphere(vec2 p) {
  float r = length(p);
  return sqrt(max(1.0 - r * r * 4.0, 0.0));
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
float t = u_time * ${speed};
vec2 q = p * ${scale} + ${seed};
int m = ${mode};
float v;
if (m == 0) {
  v = sfFbm(q + vec2(0.0, 0.3 * t), ${octaves}, ${lacunarity}, ${persistence}) * 0.5 + 0.5;
} else if (m == 1) {
  v = 0.5 * (simplex2D(q - vec2(0.0, 0.3 * t)) + simplex2D(2.0 * q + vec2(0.0, 0.32 * t))) * 0.5 + 0.5;
} else if (m == 2) {
  v = sfTendrils(p * 13.0, t);
  v = pow(clamp(v * v * ${contrast}, 0.0, 1.0), 0.7);
} else if (m == 3) {
  v = sfRings(p, t);
} else if (m == 4) {
  v = sfWaves(p, t);
} else if (m == 5) {
  v = sfRipples(p, t);
} else if (m == 6) {
  v = sfBlobs(p, t);
} else if (m == 7) {
  v = abs(simplex2D(q + t * 0.2));
} else {
  v = sfSphere(p);
}
v = clamp(v * ${contrast} + ${brightness}, 0.0, 1.0);
return vec4(v, v, v, 1.0);`,
    }
  }
}

register(ScalarField)
export default ScalarField
