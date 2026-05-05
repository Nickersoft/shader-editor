import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColor().default([0.02, 0.02, 0.05]).describe('Background'),
  color1: zColor().default([1.0, 0.9, 0.4]).describe('Color 1'),
  color2: zColor().default([0.95, 0.3, 0.5]).describe('Color 2'),
  color3: zColor().default([0.3, 0.5, 1.0]).describe('Color 3'),
  bandCount: zFloat(0, 15, 1).default(4).describe('Bands'),
  twist: zFloat(0, 1).default(0.4).describe('Twist'),
  centerSize: zFloat(0, 1).default(0.3).describe('Center'),
  proportion: zFloat(0, 1).default(0.5).describe('Proportion'),
  softness: zFloat(0, 1).default(0.0).describe('Softness'),
  noiseAmount: zFloat(0, 1).default(0.0).describe('Noise'),
  noiseFrequency: zFloat(0, 1).default(0.5).describe('Noise Freq'),
  speed: zFloat(0, 4, 0.05).default(0.4).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Swirl Tile',
  description: 'swirl — twisting color bands (faithful port)',
  color: '#a78bfa',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class SwirlTile extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'swirl-tile'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const color1 = this.uniformName('color1')
    const color2 = this.uniformName('color2')
    const color3 = this.uniformName('color3')
    const bandCount = this.uniformName('bandCount')
    const twist = this.uniformName('twist')
    const centerSize = this.uniformName('centerSize')
    const proportion = this.uniformName('proportion')
    const softness = this.uniformName('softness')
    const noiseAmount = this.uniformName('noiseAmount')
    const noiseFrequency = this.uniformName('noiseFrequency')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['snoise', 'pi'],
      main: `
vec2 _ar = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 shape_uv = p;
float l = max(1e-4, length(shape_uv));
float t = u_time * ${speed};
float angle = ceil(${bandCount}) * atan(shape_uv.y, shape_uv.x) + t;
float angle_norm = angle / TWO_PI;
float twist = 3.0 * clamp(${twist}, 0.0, 1.0);
float offset = pow(l, -twist) + angle_norm;
float shape = fract(offset);
shape = 1.0 - abs(2.0 * shape - 1.0);
shape += ${noiseAmount} * snoise(15.0 * pow(${noiseFrequency}, 2.0) * shape_uv);
float mid = smoothstep(0.2, 0.2 + 0.8 * ${centerSize}, pow(l, twist));
shape = mix(0.0, shape, mid);
float proportion = clamp(${proportion}, 0.0, 1.0);
float exponent = mix(0.25, 1.0, proportion * 2.0);
exponent = mix(exponent, 10.0, max(0.0, proportion * 2.0 - 1.0));
shape = pow(shape, exponent);
float mixer = shape * 3.0;
vec3 cols[3];
cols[0] = ${color1};
cols[1] = ${color2};
cols[2] = ${color3};
vec3 gradient = cols[0];
float outerShape = 0.0;
for (int i = 1; i < 4; i++) {
  if (i > 3) break;
  float m = clamp(mixer - float(i - 1), 0.0, 1.0);
  float aa = fwidth(m);
  m = smoothstep(0.5 - 0.5 * ${softness} - aa, 0.5 + 0.5 * ${softness} + aa, m);
  if (i == 1) outerShape = m;
  vec3 c = i < 3 ? cols[i] : cols[2];
  gradient = mix(gradient, c, m);
}
float midAA = 0.1 * fwidth(pow(l, -twist));
float outerMid = smoothstep(0.2, 0.2 + midAA, pow(l, twist));
outerShape = mix(0.0, outerShape, outerMid);
vec3 color = gradient * outerShape + ${colorBack} * (1.0 - outerShape);
return vec4(color, 1.0);`,
    }
  }
}

register(SwirlTile)
export default SwirlTile
