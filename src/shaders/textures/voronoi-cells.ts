import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColor, zFloat, zInt, zPalette, type Palette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(6)
    .default({
      values: [
        [0.4, 0.7, 1.0, 1],
        [0.95, 0.5, 0.7, 1],
        [0.3, 0.95, 0.7, 1],
      ],
      length: 3,
    } satisfies Palette)
    .describe('Colors'),
  colorGap: zColor().default([0.05, 0.05, 0.08]).describe('Gap Color'),
  colorGlow: zColor().default([0.0, 0.0, 0.0]).describe('Glow Color'),
  scale: zFloat(0.5, 20, 0.1).default(5).describe('Scale'),
  distortion: zFloat(0, 0.5, 0.005).default(0.25).describe('Distortion'),
  gap: zFloat(0, 0.1, 0.001).default(0.01).describe('Gap'),
  glow: zFloat(0, 1).default(0.2).describe('Glow'),
  stepsPerColor: zInt(1, 6).default(1).describe('Steps/Color'),
  speed: zFloat(0, 4, 0.05).default(0.4).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Voronoi',
  description: 'Animated cell mosaic with palette colors, gap, and glow',
  color: '#06b6d4',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class VoronoiCells extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'voronoi-cells'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const colorGap = this.uniformName('colorGap')
    const colorGlow = this.uniformName('colorGlow')
    const scale = this.uniformName('scale')
    const distortion = this.uniformName('distortion')
    const gap = this.uniformName('gap')
    const glow = this.uniformName('glow')
    const stepsPerColor = this.uniformName('stepsPerColor')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash22'],
      functions: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
vec4 vcVoronoi(vec2 x, float t, float dist) {
  vec2 ip = floor(x), fp = fract(x), mg, mr;
  float md = 8.0, rand = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 oRaw = hash22(ip + g);
    vec2 o = 0.5 + dist * sin(t + TWO_PI * oRaw);
    vec2 r = g + o - fp;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; rand = oRaw.x; }
  }
  md = 8.0;
  for (int j = -3; j <= 3; j++) for (int i = -3; i <= 3; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 oRaw = hash22(ip + g);
    vec2 o = 0.5 + dist * sin(t + TWO_PI * oRaw);
    vec2 r = g + o - fp;
    if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec4(md, mr, rand);
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 q = p * ${scale};
float t = u_time * ${speed};
vec4 v = vcVoronoi(q, t, ${distortion});
int n = max(${colors}_count, 1);
int spc = max(${stepsPerColor}, 1);
float cellId = clamp(v.w, 0.0, 1.0);
float mixer = cellId * float(n);
int i0 = int(floor(mixer));
int i1 = (i0 + 1) % n;
float f = fract(mixer);
f = floor(f * float(spc)) / max(float(spc) - 1.0, 1.0);
vec3 cellColor = mix(${colors}[i0 % 6].rgb, ${colors}[i1 % 6].rgb, clamp(f, 0.0, 1.0));
float glowAmt = pow(length(v.yz * ${glow}), 1.5);
vec3 color = mix(cellColor, ${colorGlow}, glowAmt);
float edge = v.x;
float smoothEdge = 0.02 * (1.0 + 0.5 * ${gap});
edge = smoothstep(${gap} - smoothEdge, ${gap} + smoothEdge, edge);
color = mix(${colorGap}, color, edge);
return vec4(color, 1.0);`,
    }
  }
}

register(VoronoiCells)
export default VoronoiCells
