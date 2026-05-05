import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import {
  zBool,
  zColorRgba,
  zFloat,
  zPalette,
  type Palette,
} from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(7)
    .default({
      values: [
        [1.0, 0.616, 0.0, 1],
        [0.992, 0.31, 0.188, 1],
        [0.502, 0.608, 1.0, 1],
        [0.427, 0.18, 1.0, 1],
        [0.2, 0.227, 1.0, 1],
        [0.945, 0.361, 1.0, 1],
        [1.0, 0.835, 0.341, 1],
      ],
      length: 7,
    } satisfies Palette)
    .describe('Colors'),
  colorBack: zColorRgba().default([0, 0, 0, 1]).describe('Background'),
  density: zFloat(0.25, 7, 0.05).default(3).describe('Density'),
  angle1: zFloat(-1, 1).default(0).describe('Angle 1'),
  angle2: zFloat(-1, 1).default(0).describe('Angle 2'),
  length: zFloat(0.01, 3).default(1.1).describe('Length'),
  edges: zBool().default(false).describe('Edges'),
  blur: zFloat(0, 0.5, 0.005).default(0).describe('Blur'),
  fadeIn: zFloat(0, 1).default(1).describe('Fade In'),
  fadeOut: zFloat(0, 1).default(0.3).describe('Fade Out'),
  gradient: zFloat(0, 1).default(0).describe('Gradient'),
  speed: zFloat(0, 4, 0.05).default(0.5).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Color Panels',
  description: 'Pseudo-3D semi-transparent panels rotating around a central axis',
  color: '#fb923c',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class ColorArrayRadialPanels extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'color-array-radial-panels'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const colorBack = this.uniformName('colorBack')
    const density = this.uniformName('density')
    const angle1 = this.uniformName('angle1')
    const angle2 = this.uniformName('angle2')
    const length = this.uniformName('length')
    const edges = this.uniformName('edges')
    const blur = this.uniformName('blur')
    const fadeIn = this.uniformName('fadeIn')
    const fadeOut = this.uniformName('fadeOut')
    const gradient = this.uniformName('gradient')
    const speed = this.uniformName('speed')
    return {
      functions: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979
#endif
const float CP_Z_LIMIT = 0.5;

vec2 cpGetPanel(float angle, vec2 uv, float invLength, float aa, float blur, float a1, float a2, bool edges) {
  float sinA = sin(angle);
  float cosA = cos(angle);
  float denom = sinA - uv.y * cosA;
  if (abs(denom) < 0.01) return vec2(0.0);
  float z = uv.y / denom;
  if (z <= 0.0 || z > CP_Z_LIMIT) return vec2(0.0);
  float zRatio = z / CP_Z_LIMIT;
  float panelMap = 1.0 - zRatio;
  float x = uv.x * (cosA * z + 1.0) * invLength;
  float zOff = zRatio - 0.5;
  float left = -0.5 + zOff * a1;
  float right = 0.5 - zOff * a2;
  float blurX = aa + 2.0 * panelMap * blur;
  float panel = smoothstep(left - blurX, left + 0.25 * blurX, x)
              * (1.0 - smoothstep(right - 0.25 * blurX, right + blurX, x));
  panel *= mix(0.0, panel, smoothstep(0.0, 0.01, panelMap));
  float midScreen = abs(sinA);
  if (edges) {
    panelMap = mix(0.99, panelMap, panel * clamp(panelMap / (0.15 * (1.0 - pow(midScreen, 0.1))), 0.0, 1.0));
  } else if (midScreen < 0.07) {
    panel *= midScreen * 15.0;
  }
  return vec2(panel, panelMap);
}

vec4 cpBlend(vec4 colorA, float panelMask, float panelMap, float fadeIn, float fadeOut) {
  float fade = 1.0 - smoothstep(0.97 - 0.97 * fadeIn, 1.0, panelMap);
  fade *= smoothstep(-0.2 * (1.0 - fadeOut), fadeOut, panelMap);
  vec3 blendedRGB = mix(vec3(0.0), colorA.rgb, fade);
  float blendedAlpha = mix(0.0, colorA.a, fade);
  return vec4(blendedRGB, blendedAlpha) * panelMask;
}`,
      main: `
vec2 _ar = vec2(u_resolution.x / u_resolution.y, 1.0);
vec2 p = (uv - 0.5) * _ar;
vec2 cpUv = p * 1.25;
float t = fract(0.02 * u_time * ${speed});
bool reverseTime = (t < 0.5);
vec3 color = vec3(0.0);
float opacity = 0.0;
float aa = 0.005;
int colorsCount = max(1, ${colors}_count);
vec4 premultiplied[7];
for (int i = 0; i < 7; i++) {
  if (i >= colorsCount) break;
  vec4 c = ${colors}[i];
  c.rgb *= c.a;
  premultiplied[i] = c;
}
float invLength = 1.5 / max(${length}, 0.001);
int panelsNumber = 12;
float densityNormalizer = 1.0;
if (colorsCount == 4) { panelsNumber = 16; densityNormalizer = 1.34; }
else if (colorsCount == 5) { panelsNumber = 20; densityNormalizer = 1.67; }
else if (colorsCount == 7) { panelsNumber = 14; densityNormalizer = 1.17; }
float fPanelsNumber = float(panelsNumber);
float panelGrad = 1.0 - clamp(${gradient}, 0.0, 1.0);
for (int set = 0; set < 2; set++) {
  bool isForward = (set == 0 && !reverseTime) || (set == 1 && reverseTime);
  if (!isForward) continue;
  for (int i = 0; i <= 20; i++) {
    if (i >= panelsNumber) break;
    int idx = panelsNumber - 1 - i;
    float offset = float(idx) / fPanelsNumber;
    if (set == 1) offset += 0.5;
    float densityFract = densityNormalizer * fract(t + offset);
    float angleNorm = densityFract / max(${density}, 1e-4);
    if (densityFract >= 0.5 || angleNorm >= 0.3) continue;
    float smoothDensity = clamp((0.5 - densityFract) / 0.1, 0.0, 1.0)
                       * clamp(densityFract / 0.01, 0.0, 1.0);
    float smoothAngle = clamp((0.3 - angleNorm) / 0.05, 0.0, 1.0);
    if (smoothDensity * smoothAngle < 0.001) continue;
    if (angleNorm > 0.5) angleNorm = 0.5;
    vec2 panel = cpGetPanel(angleNorm * TWO_PI + PI, cpUv, invLength, aa, ${blur}, ${angle1}, ${angle2}, ${edges});
    if (panel.x <= 0.001) continue;
    float panelMask = panel.x * smoothDensity * smoothAngle;
    float panelMap = panel.y;
    int colorIdx = idx - (idx / colorsCount) * colorsCount;
    int nextColorIdx = (idx + 1) - ((idx + 1) / colorsCount) * colorsCount;
    vec4 colorA = premultiplied[colorIdx];
    vec4 colorB = premultiplied[nextColorIdx];
    colorA = mix(colorA, colorB, max(0.0, smoothstep(0.0, 0.45, panelMap) - panelGrad));
    vec4 blended = cpBlend(colorA, panelMask, panelMap, ${fadeIn}, ${fadeOut});
    color = blended.rgb + color * (1.0 - blended.a);
    opacity = blended.a + opacity * (1.0 - blended.a);
  }
  for (int i = 0; i <= 20; i++) {
    if (i >= panelsNumber) break;
    int idx = panelsNumber - 1 - i;
    float offset = float(idx) / fPanelsNumber;
    if (set == 0) offset += 0.5;
    float densityFract = densityNormalizer * fract(-t + offset);
    float angleNorm = -densityFract / max(${density}, 1e-4);
    if (densityFract >= 0.5 || angleNorm < -0.3) continue;
    float smoothDensity = clamp((0.5 - densityFract) / 0.1, 0.0, 1.0)
                       * clamp(densityFract / 0.01, 0.0, 1.0);
    float smoothAngle = clamp((angleNorm + 0.3) / 0.05, 0.0, 1.0);
    if (smoothDensity * smoothAngle < 0.001) continue;
    vec2 panel = cpGetPanel(angleNorm * TWO_PI + PI, cpUv, invLength, aa, ${blur}, ${angle1}, ${angle2}, ${edges});
    float panelMask = panel.x * smoothDensity * smoothAngle;
    if (panelMask <= 0.001) continue;
    float panelMap = panel.y;
    int rawIdx = (colorsCount - (idx - (idx / colorsCount) * colorsCount)) - ((colorsCount - (idx - (idx / colorsCount) * colorsCount)) / colorsCount) * colorsCount;
    int colorIdx = rawIdx;
    int nextColorIdx = (colorIdx + 1) - ((colorIdx + 1) / colorsCount) * colorsCount;
    vec4 colorA = premultiplied[colorIdx];
    vec4 colorB = premultiplied[nextColorIdx];
    colorA = mix(colorA, colorB, max(0.0, smoothstep(0.0, 0.45, panelMap) - panelGrad));
    vec4 blended = cpBlend(colorA, panelMask, panelMap, ${fadeIn}, ${fadeOut});
    color = blended.rgb + color * (1.0 - blended.a);
    opacity = blended.a + opacity * (1.0 - blended.a);
  }
}
vec3 bg = ${colorBack}.rgb * ${colorBack}.a;
color = color + bg * (1.0 - opacity);
opacity = opacity + ${colorBack}.a * (1.0 - opacity);
return vec4(color, opacity);`,
    }
  }
}

register(ColorArrayRadialPanels)
export default ColorArrayRadialPanels
