import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  color1: zColor().default([0.0, 0.0, 0.05]).describe('Color 1'),
  color2: zColor().default([0.4, 0.6, 1.0]).describe('Color 2'),
  color3: zColor().default([1.0, 0.95, 0.85]).describe('Color 3'),
  softness: zFloat(0, 1).default(1.0).describe('Softness'),
  stepsPerColor: zFloat(1, 10, 1).default(1).describe('Steps'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Simplex Noise ',
  description: 'simplex-noise — two-sample sum to ramp (faithful port)',
  color: '#8b5cf6',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

// Class is `SimplexTile` (typeId stays 'paper-simplex-noise' for save-file compat).
export class SimplexNoiseTile extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'simplex-noise-tile'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const color3 = this.uniformName('color3')
    const softness = this.uniformName('softness')
    const stepsPerColor = this.uniformName('stepsPerColor')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['snoise'],
      functions: `
float steppedSmooth(float m, float steps, float softness) {
  float stepT = floor(m * steps) / steps;
  float f = m * steps - floor(m * steps);
  float fw = steps * fwidth(m);
  float smoothed = smoothstep(0.5 - softness, min(1.0, 0.5 + softness + fw), f);
  return stepT + smoothed / steps;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 shape_uv = p * 0.1 * 10.0;
float t = 0.2 * u_time * ${speed};
float n = 0.5 * snoise(shape_uv - vec2(0.0, 0.3 * t));
n += 0.5 * snoise(2.0 * shape_uv + vec2(0.0, 0.32 * t));
float shape = 0.5 + 0.5 * n;
float mixer = (shape - 0.5 / 3.0) * 3.0;
float steps = max(1.0, ${stepsPerColor});
vec3 cols[3];
cols[0] = ${color1};
cols[1] = ${color2};
cols[2] = ${color3};
vec3 gradient = cols[0];
for (int i = 1; i < 3; i++) {
  float localM = clamp(mixer - float(i - 1), 0.0, 1.0);
  localM = steppedSmooth(localM, steps, 0.5 * ${softness});
  gradient = mix(gradient, cols[i], localM);
}
if (mixer < 0.0 || mixer > 2.0) {
  float localM = mixer + 1.0;
  if (mixer > 2.0) localM = mixer - 2.0;
  localM = steppedSmooth(localM, steps, 0.5 * ${softness});
  gradient = mix(cols[2], cols[0], localM);
}
return vec4(gradient, 1.0);`,
    }
  }
}

register(SimplexNoiseTile)
export default SimplexNoiseTile
