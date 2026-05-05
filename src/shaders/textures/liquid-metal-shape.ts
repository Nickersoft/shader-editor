import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zAngle, zColorRgba, zFloat } from '@/shaders/core/schemas'

const config = z.object({
  colorBack: zColorRgba().default([0.95, 0.95, 0.97, 1.0]).describe('Background'),
  colorTint: zColorRgba().default([0.55, 0.65, 1.0, 0.0]).describe('Tint'),
  shape: zFloat(0, 4, 1).default(0.0).describe('Shape'),
  angle: zAngle().default(0.0).describe('Angle'),
  repetition: zFloat(1, 10, 0.1).default(4.0).describe('Repetition'),
  softness: zFloat(0, 1).default(0.5).describe('Softness'),
  shiftRed: zFloat(-1, 1).default(0.3).describe('Shift Red'),
  shiftBlue: zFloat(-1, 1).default(-0.3).describe('Shift Blue'),
  distortion: zFloat(0, 1).default(0.5).describe('Distortion'),
  contour: zFloat(0, 1).default(0.4).describe('Contour'),
  speed: zFloat(0, 4, 0.05).default(0.3).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Liquid Metal Shape',
  description: 'Paper liquid-metal chrome stripes on built-in shapes using Paper vertex UVs',
  color: '#94a3b8',
  category: 'textures',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class LiquidMetalShape extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'liquid-metal-shape'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colorBack = this.uniformName('colorBack')
    const colorTint = this.uniformName('colorTint')
    const shape = this.uniformName('shape')
    const angle = this.uniformName('angle')
    const repetition = this.uniformName('repetition')
    const softness = this.uniformName('softness')
    const shiftRed = this.uniformName('shiftRed')
    const shiftBlue = this.uniformName('shiftBlue')
    const distortion = this.uniformName('distortion')
    const contour = this.uniformName('contour')
    const speed = this.uniformName('speed')

    return {
      dependencies: ['pi', 'rotate', 'snoise', 'colorBandingFix'],
      functions: `
float plmGetColorChanges(float c1, float c2, float stripeP, vec3 w, float blur, float bump, float tint, float tintAlpha) {
  float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripeP));
  float border = w.x;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripeP));
  border = w.x + 0.4 * (1.0 - bump) * w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripeP));
  border = w.x + 0.5 * (1.0 - bump) * w.y;
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripeP));
  border = w.x + w.y;
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripeP));
  float gradientT = (stripeP - w.x - w.y) / max(w.z, 1e-4);
  float gradient = mix(c1, c2, smoothstep(0.0, 1.0, gradientT));
  ch = mix(ch, gradient, smoothstep(border, border + 0.5 * blur, stripeP));
  return mix(ch, 1.0 - min(1.0, (1.0 - ch) / max(tint, 0.0001)), tintAlpha);
}`,
      main: `
float t = 0.3 * (u_time * ${speed} + 2.8);
vec2 metalUv = v_objectUV + 0.5;
metalUv.y = 1.0 - metalUv.y;
float cycleWidth = ${repetition};
float edge = 0.0;
float contOffset = 1.0;

if (${shape} < 1.0) {
  vec2 borderUV = v_responsiveUV + 0.5;
  float ratio = v_responsiveBoxGivenSize.x / max(v_responsiveBoxGivenSize.y, 1.0);
  vec2 mask = min(borderUV, 1.0 - borderUV);
  vec2 pixelThickness = min(250.0 / max(v_responsiveBoxGivenSize, vec2(1.0)), vec2(0.5));
  float maskX = pow(smoothstep(0.0, pixelThickness.x, mask.x), 0.25);
  float maskY = pow(smoothstep(0.0, pixelThickness.y, mask.y), 0.25);
  edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
  metalUv = v_responsiveUV;
  if (ratio > 1.0) metalUv.y /= ratio;
  else metalUv.x *= ratio;
  metalUv += 0.5;
  metalUv.y = 1.0 - metalUv.y;
  cycleWidth *= 2.0;
  contOffset = 1.5;
} else if (${shape} < 2.0) {
  vec2 shapeUV = (metalUv - 0.5) * 0.67;
  edge = pow(clamp(3.0 * length(shapeUV), 0.0, 1.0), 18.0);
} else if (${shape} < 3.0) {
  vec2 shapeUV = (metalUv - 0.5) * 1.68;
  float r = length(shapeUV) * 2.0;
  float a = atan(shapeUV.y, shapeUV.x) + 0.2;
  r *= 1.0 + 0.05 * sin(3.0 * a + 2.0 * t);
  float f = abs(cos(a * 3.0));
  edge = smoothstep(f, f + 0.7, r);
  edge *= edge;
  metalUv *= 0.8;
  cycleWidth *= 1.6;
} else if (${shape} < 4.0) {
  vec2 shapeUV = rotate((metalUv - 0.5), 0.25 * PI) * 1.42 + 0.5;
  vec2 mask = min(shapeUV, 1.0 - shapeUV);
  float maskX = pow(smoothstep(0.0, 0.15, mask.x), 0.25);
  float maskY = pow(smoothstep(0.0, 0.15, mask.y), 0.25);
  edge = clamp(1.0 - maskX * maskY, 0.0, 1.0);
} else {
  vec2 shapeUV = (metalUv - 0.5) * 1.3;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float speed = 1.5 + 2.0 / 3.0 * sin(fi * 12.345);
    float angle = -fi * 1.5;
    vec2 dir1 = vec2(cos(angle), sin(angle));
    vec2 dir2 = vec2(cos(angle + 1.57), sin(angle + 1.0));
    vec2 traj = 0.4 * (dir1 * sin(t * speed + fi * 1.23) + dir2 * cos(t * speed * 0.7 + fi * 2.17));
    float d = length(shapeUV + traj);
    edge += pow(1.0 - clamp(d, 0.0, 1.0), 4.0);
  }
  edge = 1.0 - smoothstep(0.65, 0.9, edge);
  edge = pow(edge, 4.0);
}

edge = mix(smoothstep(0.9 - 2.0 * fwidth(edge), 0.9, edge), edge, smoothstep(0.0, 0.4, ${contour}));
float opacity = 1.0 - smoothstep(0.9 - 2.0 * fwidth(edge), 0.9, edge);
if (${shape} < 2.0) edge = 1.2 * edge;
else edge = 1.8 * pow(edge, 1.5);

vec2 rotatedUV = metalUv - 0.5;
float angle = (-${angle} + 70.0) * PI / 180.0;
rotatedUV = vec2(
  rotatedUV.x * cos(angle) - rotatedUV.y * sin(angle),
  rotatedUV.x * sin(angle) + rotatedUV.y * cos(angle)
) + 0.5;
float diagBLtoTR = rotatedUV.x - rotatedUV.y;
float diagTLtoBR = rotatedUV.x + rotatedUV.y;

vec3 color1 = vec3(0.98, 0.98, 1.0);
vec3 color2 = vec3(0.1, 0.1, 0.1 + 0.1 * smoothstep(0.7, 1.3, diagTLtoBR));
vec2 gradUv = metalUv - 0.5;
float dist = length(gradUv + vec2(0.0, 0.2 * diagBLtoTR));
gradUv = rotate(gradUv, (0.25 - 0.2 * diagBLtoTR) * PI);
float direction = gradUv.x;
float bump = 1.0 - pow(1.8 * dist, 1.2);
bump *= pow(metalUv.y, 0.3);

float thin1Ratio = 0.12 / cycleWidth * (1.0 - 0.4 * bump);
float thin2Ratio = 0.07 / cycleWidth * (1.0 + 0.4 * bump);
float wideRatio = 1.0 - thin1Ratio - thin2Ratio;
float noise = snoise(metalUv - t);
edge += (1.0 - edge) * ${distortion} * noise;
direction += diagBLtoTR;
direction -= 2.0 * noise * diagBLtoTR * (smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge)));
direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, ${contour}));
direction -= 1.7 * edge * smoothstep(0.5, 1.0, ${contour});
direction += 0.2 * pow(${contour}, 4.0) * (1.0 - smoothstep(0.0, 1.0, edge));
bump *= clamp(pow(metalUv.y, 0.1), 0.3, 1.0);
direction *= 0.1 + (1.1 - edge) * bump;
direction *= 0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge));
direction += 0.18 * (smoothstep(0.1, 0.2, metalUv.y) * (1.0 - smoothstep(0.2, 0.4, metalUv.y)));
direction += 0.03 * (smoothstep(0.1, 0.2, 1.0 - metalUv.y) * (1.0 - smoothstep(0.2, 0.4, 1.0 - metalUv.y)));
direction *= 0.5 + 0.5 * pow(metalUv.y, 2.0);
direction *= cycleWidth;
direction -= t;

float colorDispersion = clamp(1.0 - bump, 0.0, 1.0);
float dispersionRed = colorDispersion + 0.03 * bump * noise;
dispersionRed += 5.0 * (smoothstep(-0.1, 0.2, metalUv.y) * (1.0 - smoothstep(0.1, 0.5, metalUv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 1.0, bump)));
dispersionRed -= diagBLtoTR;
float dispersionBlue = colorDispersion * 1.3;
dispersionBlue += (smoothstep(0.0, 0.4, metalUv.y) * (1.0 - smoothstep(0.1, 0.8, metalUv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 0.8, bump)));
dispersionBlue -= 0.2 * edge;
dispersionRed *= ${shiftRed} / 20.0;
dispersionBlue *= ${shiftBlue} / 20.0;

float blur = ${softness} / 15.0 + 0.3 * contOffset;
vec3 w = vec3(cycleWidth * thin1Ratio, cycleWidth * thin2Ratio, wideRatio);
w.y -= 0.02 * smoothstep(0.0, 1.0, edge + bump);
float tintA = ${colorTint}.a;
float r = plmGetColorChanges(color1.r, color2.r, fract(direction + dispersionRed), w, blur + fwidth(direction), bump, ${colorTint}.r, tintA);
float g = plmGetColorChanges(color1.g, color2.g, fract(direction), w, blur + fwidth(direction), bump, ${colorTint}.g, tintA);
float b = plmGetColorChanges(color1.b, color2.b, fract(direction - dispersionBlue), w, blur + fwidth(direction), bump, ${colorTint}.b, tintA);
vec3 color = vec3(r, g, b) * opacity;
vec3 bgColor = ${colorBack}.rgb * ${colorBack}.a;
color = color + bgColor * (1.0 - opacity);
float outA = opacity + ${colorBack}.a * (1.0 - opacity);
return vec4(colorBandingFix(color), outA);`,
    }
  }
}

register(LiquidMetalShape)
export default LiquidMetalShape
