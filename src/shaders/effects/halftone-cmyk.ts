import { z } from 'zod'
import { EffectNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  size: zFloat(0, 1).default(0.5).describe('Cell Size'),
  softness: zFloat(0, 1).default(0).describe('Softness'),
  contrast: zFloat(0.1, 4).default(1).describe('Contrast'),
  colorBack: zColor().default([1, 1, 1]).describe('Paper'),
  colorC: zColor().default([0.0, 0.65, 0.92]).describe('Cyan'),
  colorM: zColor().default([0.93, 0.0, 0.45]).describe('Magenta'),
  colorY: zColor().default([1.0, 0.92, 0.0]).describe('Yellow'),
  colorK: zColor().default([0.05, 0.05, 0.05]).describe('Black'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Halftone CMYK',
  description: 'Four-channel CMYK halftone with rotated screens (15°/75°/0°/45°)',
  color: '#475569',
  category: 'effects',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class HalftoneCmyk extends EffectNode<Config, Inputs> {
  static readonly typeId = 'halftone-cmyk'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const size = this.uniformName('size')
    const softness = this.uniformName('softness')
    const contrast = this.uniformName('contrast')
    const colorBack = this.uniformName('colorBack')
    const colorC = this.uniformName('colorC')
    const colorM = this.uniformName('colorM')
    const colorY = this.uniformName('colorY')
    const colorK = this.uniformName('colorK')
    return {
      functions: `
const float HC_COS_C = 0.9659258;
const float HC_SIN_C = 0.2588190;
const float HC_COS_M = 0.2588190;
const float HC_SIN_M = 0.9659258;
const float HC_COS_K = 0.7071068;
const float HC_SIN_K = 0.7071068;
float hcDotMask(vec2 uv, vec2 cellOffset, float cov, float softness) {
  vec2 cellCenter = floor(uv) + 0.5 + cellOffset;
  vec2 pos = uv;
  float d = length(pos - cellCenter);
  float radius = clamp(cov, 0.0, 1.0) * 0.55;
  float mask = 1.0 - smoothstep(radius * (1.0 - softness * 0.5), radius + softness * 0.05 + 1e-4, d);
  return mask;
}
float hcAccum(vec2 uv, float cov, float softness) {
  float m = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      m += hcDotMask(uv, vec2(float(dx), float(dy)), cov, softness);
    }
  }
  return clamp(m, 0.0, 1.0);
}`,
      main: `
vec4 src = texture(u_prevPass, uv);
vec3 rgb = clamp((src.rgb - 0.5) * ${contrast} + 0.5, 0.0, 1.0);
float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
vec3 cmy = vec3(0.0);
float denom = 1.0 - k;
if (denom > 1e-5) cmy = (1.0 - rgb - vec3(k)) / denom;
float cellsPerSide = mix(400.0, 7.0, pow(clamp(${size}, 0.0, 1.0), 0.7));
vec2 grid = (uv - 0.5) * cellsPerSide * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
vec2 uvC = mat2(HC_COS_C, HC_SIN_C, -HC_SIN_C, HC_COS_C) * grid - 0.5;
vec2 uvM = mat2(HC_COS_M, HC_SIN_M, -HC_SIN_M, HC_COS_M) * grid - 0.25;
vec2 uvY = grid + 0.2;
vec2 uvK = mat2(HC_COS_K, HC_SIN_K, -HC_SIN_K, HC_COS_K) * grid;
float maskC = hcAccum(uvC, cmy.x * src.a, ${softness});
float maskM = hcAccum(uvM, cmy.y * src.a, ${softness});
float maskY = hcAccum(uvY, cmy.z * src.a, ${softness});
float maskK = hcAccum(uvK, k * src.a, ${softness});
vec3 paper = ${colorBack};
paper *= mix(vec3(1.0), ${colorC}, maskC);
paper *= mix(vec3(1.0), ${colorM}, maskM);
paper *= mix(vec3(1.0), ${colorY}, maskY);
paper *= mix(vec3(1.0), ${colorK}, maskK);
return vec4(paper, 1.0);`,
    }
  }
}

register(HalftoneCmyk)
export default HalftoneCmyk
