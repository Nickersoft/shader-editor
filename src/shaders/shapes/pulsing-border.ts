import { z } from 'zod'
import { GeneratorNode } from '@/shaders/core/node'
import { register } from '@/shaders/core/registry'
import type { GlslBlock, NodeMeta } from '@/shaders/core/types'
import { zColorRgba, zFloat, zInt, zPalette } from '@/shaders/core/schemas'

const config = z.object({
  colors: zPalette(5)
    .default({
      values: [
        [0.051, 0.757, 0.992, 1],
        [0.851, 0.082, 0.937, 1],
        [1.0, 0.247, 0.18, 0.8],
      ],
      length: 3,
    })
    .describe('Colors'),
  colorBack: zColorRgba().default([0, 0, 0, 1]).describe('Background'),
  roundness: zFloat(0, 1).default(0.25).describe('Roundness'),
  thickness: zFloat(0, 1).default(0.1).describe('Thickness'),
  softness: zFloat(0, 1).default(0.75).describe('Softness'),
  intensity: zFloat(0, 1).default(0.2).describe('Intensity'),
  bloom: zFloat(0, 1).default(0.25).describe('Bloom'),
  spots: zInt(1, 4).default(4).describe('Spots/Color'),
  spotSize: zFloat(0, 1).default(0.5).describe('Spot Size'),
  pulse: zFloat(0, 1).default(0.25).describe('Pulse'),
  smoke: zFloat(0, 1).default(0.3).describe('Smoke'),
  smokeSize: zFloat(0, 1).default(0.6).describe('Smoke Size'),
  marginLeft: zFloat(0, 0.45).default(0).describe('Margin L'),
  marginRight: zFloat(0, 0.45).default(0).describe('Margin R'),
  marginTop: zFloat(0, 0.45).default(0).describe('Margin T'),
  marginBottom: zFloat(0, 0.45).default(0).describe('Margin B'),
  speed: zFloat(0, 4, 0.05).default(1).describe('Speed'),
})

const inputs = z.object({})

const meta: NodeMeta = {
  name: 'Pulsing Border',
  description: 'Luminous trails of color sweeping around a rounded-rectangle perimeter',
  color: '#22d3ee',
  category: 'shapes',
  defaultBlendMode: 'normal',
}

type Config = z.infer<typeof config>
type Inputs = z.infer<typeof inputs>

export class PulsingBorder extends GeneratorNode<Config, Inputs> {
  static readonly typeId = 'pulsing-border'
  static readonly config = config
  static readonly inputs = inputs
  static readonly meta = meta

  glsl(): GlslBlock {
    const colors = this.uniformName('colors')
    const colorBack = this.uniformName('colorBack')
    const roundness = this.uniformName('roundness')
    const thickness = this.uniformName('thickness')
    const softness = this.uniformName('softness')
    const intensity = this.uniformName('intensity')
    const bloom = this.uniformName('bloom')
    const spots = this.uniformName('spots')
    const spotSize = this.uniformName('spotSize')
    const pulse = this.uniformName('pulse')
    const smoke = this.uniformName('smoke')
    const smokeSize = this.uniformName('smokeSize')
    const mL = this.uniformName('marginLeft')
    const mR = this.uniformName('marginRight')
    const mT = this.uniformName('marginTop')
    const mB = this.uniformName('marginBottom')
    const speed = this.uniformName('speed')
    return {
      dependencies: ['hash21', 'hash22'],
      functions: `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979
#endif

float pbBeat(float time) {
  float first = pow(abs(sin(time * TWO_PI)), 10.0);
  float second = pow(abs(sin((time - 0.15) * TWO_PI)), 10.0);
  return clamp(first + 0.6 * second, 0.0, 1.0);
}

float pbValueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  // hash21 returns a uniform-ish [0,1] scalar, matching Paper's noise-texture
  // green-channel substitution.
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float pbRoundedBox(
  vec2 uv, vec2 halfSize, float dist, float cornerDistance,
  float thickness, float softness
) {
  float borderDistance = abs(dist);
  float aa = 2.0 * fwidth(dist);
  float low = min(mix(thickness, -thickness, softness), thickness + aa);
  float high = max(mix(thickness, -thickness, softness), thickness + aa);
  float border = 1.0 - smoothstep(low, high, borderDistance);
  float cornerFadeCircles = 0.0;
  cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv + halfSize) / max(thickness, 1e-4))));
  cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - vec2(-halfSize.x, halfSize.y)) / max(thickness, 1e-4))));
  cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - vec2(halfSize.x, -halfSize.y)) / max(thickness, 1e-4))));
  cornerFadeCircles = mix(1.0, cornerFadeCircles, smoothstep(0.0, 1.0, length((uv - halfSize) / max(thickness, 1e-4))));
  float aa2 = fwidth(cornerDistance);
  float cornerFade = smoothstep(0.0, mix(aa2, thickness, softness), cornerDistance);
  cornerFade *= cornerFadeCircles;
  border += cornerFade;
  return border;
}`,
      main: `
const float firstFrameOffset = 109.0;
float t = 1.2 * (u_time * ${speed} + firstFrameOffset);

// borderUV: centered + aspect-corrected (Paper's v_responsiveUV equivalent).
float canvasRatio = u_resolution.x / max(u_resolution.y, 1.0);
vec2 borderUV = (uv - 0.5);
borderUV.x *= max(canvasRatio, 1.0);
borderUV.y /= min(canvasRatio, 1.0);

vec2 halfSize = vec2(0.5);
halfSize.x *= max(canvasRatio, 1.0);
halfSize.y /= min(canvasRatio, 1.0);

float pulse = ${pulse} * pbBeat(0.18 * u_time * ${speed});

float mL = ${mL};
float mR = ${mR};
float mT = ${mT};
float mB = ${mB};
float mX = mL + mR;
float mY = mT + mB;

float thickness = 0.5 * ${thickness} * min(halfSize.x, halfSize.y);
halfSize.x *= (1.0 - mX);
halfSize.y *= (1.0 - mY);

vec2 centerShift = vec2(
  (mL - mR) * max(canvasRatio, 1.0) * 0.5,
  (mB - mT) / min(canvasRatio, 1.0) * 0.5
);
borderUV -= centerShift;
halfSize -= mix(thickness, 0.0, ${softness});

float radius = mix(0.0, min(halfSize.x, halfSize.y), ${roundness});
vec2 dvec = abs(borderUV) - halfSize + radius;
float outsideDistance = length(max(dvec, 0.0001)) - radius;
float insideDistance = min(max(dvec.x, dvec.y), 0.0001);
float cornerDistance = abs(min(max(dvec.x, dvec.y) - 0.45 * radius, 0.0));
float dist = outsideDistance + insideDistance;

float borderThickness = mix(thickness, 3.0 * thickness, ${softness});
float border = pbRoundedBox(borderUV, halfSize, dist, cornerDistance, borderThickness, ${softness});
border = pow(border, 1.0 + ${softness});

vec2 smokeUV = 0.3 * ${smokeSize} * uv;
float smoke = clamp(3.0 * pbValueNoise(2.7 * smokeUV + 0.5 * t), 0.0, 1.0);
smoke -= pbValueNoise(3.4 * smokeUV - 0.5 * t);
float smokeThickness = clamp(thickness + 0.2, 0.1, 0.4);
smoke *= pbRoundedBox(borderUV, halfSize, dist, cornerDistance, smokeThickness, 1.0);
smoke = 30.0 * smoke * smoke;
smoke *= mix(0.0, 0.5, pow(${smoke}, 2.0));
smoke *= mix(1.0, pulse, ${pulse});
smoke = clamp(smoke, 0.0, 1.0);
border += smoke;
border = clamp(border, 0.0, 1.0);

vec3 blendColor = vec3(0.0);
float blendAlpha = 0.0;
vec3 addColor = vec3(0.0);
float addAlpha = 0.0;

float bloomMix = 4.0 * ${bloom};
float intensityF = 1.0 + (1.0 + 4.0 * ${softness}) * ${intensity};

float angle = atan(borderUV.y, borderUV.x) / TWO_PI;

int colorsCount = max(1, ${colors}_count);
int spotsCount = max(1, ${spots});

for (int colorIdx = 0; colorIdx < 5; colorIdx++) {
  if (colorIdx >= colorsCount) break;
  float colorIdxF = float(colorIdx);
  vec4 cv = ${colors}[colorIdx];
  vec3 c = cv.rgb * cv.a;
  float a = cv.a;
  for (int spotIdx = 0; spotIdx < 4; spotIdx++) {
    if (spotIdx >= spotsCount) break;
    float spotIdxF = float(spotIdx);
    vec2 randVal = hash22(vec2(spotIdxF * 10.0 + 2.0, 40.0 + colorIdxF));
    float speedScale = 0.1 + 0.15 * abs(sin(spotIdxF * (2.0 + colorIdxF))
                                      * cos(spotIdxF * (2.0 + 2.5 * colorIdxF)));
    float time = speedScale * t + randVal.x * 3.0;
    time *= mix(1.0, -1.0, step(0.5, randVal.y));
    float mask = 0.5 + 0.5 * mix(
      sin(t + spotIdxF * (5.0 - 1.5 * colorIdxF)),
      cos(t + spotIdxF * (3.0 + 1.3 * colorIdxF)),
      step(mod(colorIdxF, 2.0), 0.5)
    );
    float pProb = clamp(2.0 * ${pulse} - randVal.x, 0.0, 1.0);
    mask = mix(mask, pulse, pProb);
    float atg1 = fract(angle + time);
    float spotSize = 0.05 + 0.6 * pow(${spotSize}, 2.0) + 0.05 * randVal.x;
    spotSize = mix(spotSize, 0.1, pProb);
    float sector = smoothstep(0.5 - spotSize, 0.5, atg1)
                 * (1.0 - smoothstep(0.5, 0.5 + spotSize, atg1));
    sector *= mask;
    sector *= border;
    sector *= intensityF;
    sector = clamp(sector, 0.0, 1.0);
    vec3 srcColor = c * sector;
    float srcAlpha = a * sector;
    blendColor += (1.0 - blendAlpha) * srcColor;
    blendAlpha += (1.0 - blendAlpha) * srcAlpha;
    addColor += srcColor;
    addAlpha += srcAlpha;
  }
}

vec3 accumColor = mix(blendColor, addColor, bloomMix);
float accumAlpha = clamp(mix(blendAlpha, addAlpha, bloomMix), 0.0, 1.0);

vec3 bgColor = ${colorBack}.rgb * ${colorBack}.a;
vec3 outColor = accumColor + (1.0 - accumAlpha) * bgColor;
float outAlpha = accumAlpha + (1.0 - accumAlpha) * ${colorBack}.a;
return vec4(outColor, outAlpha);`,
    }
  }
}

register(PulsingBorder)
export default PulsingBorder
