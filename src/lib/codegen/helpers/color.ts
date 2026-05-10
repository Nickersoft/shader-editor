// Color-space transforms, ramp lookups, and grading helpers.

import { helper } from './types'

export const rgb2hsv = helper({
  code: `
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}`,
})

export const hsv2rgb = helper({
  code: `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`,
})

/**
 * Smooth/stepped color-ramp lookup over a fixed-size vec4 palette.
 * - steps=0 → smooth, steps>0 → quantised globally.
 * - stepsPerColor>0 → quantise within each color segment.
 * - softness controls blend sharpness (0=hard, 1=fully smooth).
 * - wrap=true → palette repeats; wrap=false → clamp at last color.
 *
 * The fixed array length 10 must match `DEFAULT_VEC4_ARRAY_LENGTH` in
 * `schema-introspection.ts`.
 */
export const colorRampLookup = helper({
  code: `
vec4 colorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {
  int n = max(count, 1);
  if (n == 1) return colors[0];
  float tc = clamp(t, 0.0, 1.0);
  if (wrap) tc = fract(tc);
  if (steps > 0) {
    float fSteps = float(steps);
    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);
    tc = clamp(tc, 0.0, 1.0);
  }
  float seg = tc * float(n - 1);
  int i0 = int(floor(seg));
  int i1 = i0 + 1;
  if (i1 > n - 1) i1 = wrap ? 0 : n - 1;
  float f = seg - float(i0);
  if (stepsPerColor > 1) {
    float spc = float(stepsPerColor);
    f = floor(f * spc) / max(spc - 1.0, 1.0);
    f = clamp(f, 0.0, 1.0);
  }
  float fw = fwidth(f);
  float s = max(softness, 0.0);
  f = smoothstep(0.5 - s - fw, 0.5 + s + fw, f);
  vec4 a = colors[i0];
  vec4 b = colors[i1];
  return mix(a, b, f);
}`,
})

export const oklchTransforms = helper({
  code: `
#ifndef OKLCH_CHROMA_THRESHOLD
#define OKLCH_CHROMA_THRESHOLD 0.001
#endif
#ifndef OKLCH_HUE_NEUTRALIZER
#define OKLCH_HUE_NEUTRALIZER -2.0
#endif

vec3 srgbToLinear(vec3 srgb) {
  return pow(max(srgb, vec3(0.0)), vec3(2.2));
}

vec3 linearToSrgb(vec3 linear) {
  return pow(max(linear, vec3(0.0)), vec3(1.0 / 2.2));
}

vec3 LrgbToOklab(vec3 rgb) {
  float L = pow(max(0.4122214708 * rgb.r + 0.5363325363 * rgb.g + 0.0514459929 * rgb.b, 0.0), 1.0 / 3.0);
  float M = pow(max(0.2119034982 * rgb.r + 0.6806995451 * rgb.g + 0.1073969566 * rgb.b, 0.0), 1.0 / 3.0);
  float S = pow(max(0.0883024619 * rgb.r + 0.2817188376 * rgb.g + 0.6299787005 * rgb.b, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S
  );
}

vec3 OklabToLrgb(vec3 oklab) {
  float L = oklab.x;
  float a = oklab.y;
  float b = oklab.z;
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 oklabToOklch(vec3 oklab) {
  float C = length(oklab.yz);
  float H = atan(oklab.z, oklab.y);
  if (C < OKLCH_CHROMA_THRESHOLD) H = OKLCH_HUE_NEUTRALIZER;
  return vec3(oklab.x, C, H);
}

vec3 oklchToOklab(vec3 oklch) {
  return vec3(oklch.x, oklch.y * cos(oklch.z), oklch.y * sin(oklch.z));
}

float mixHue(float h1, float h2, float mixer) {
  float delta = mod(h2 - h1 + PI, TWO_PI) - PI;
  return h1 + mixer * delta;
}

vec3 srgbToOklch(vec3 rgb) {
  return oklabToOklch(LrgbToOklab(srgbToLinear(rgb)));
}

vec3 oklchToSrgb(vec3 oklch) {
  return linearToSrgb(OklabToLrgb(oklchToOklab(oklch)));
}

vec3 mixOklchVector(vec3 color1, vec3 color2, float mixer) {
  color1.x = mix(color1.x, color2.x, mixer);
  color1.y = mix(color1.y, color2.y, mixer);
  if (color1.y > OKLCH_CHROMA_THRESHOLD && color2.y > OKLCH_CHROMA_THRESHOLD) {
    color1.z = mixHue(color1.z, color2.z, mixer);
  }
  return color1;
}

vec3 oklchMix(vec3 color1, vec3 color2, float mixer) {
  vec3 o1 = srgbToOklch(color1);
  vec3 o2 = srgbToOklch(color2);
  return clamp(oklchToSrgb(mixOklchVector(o1, o2, mixer)), 0.0, 1.0);
}`,
  needs: ['pi'],
})

export const oklchColorRampLookup = helper({
  code: `
vec4 oklchColorRampLookup(float t, vec4 colors[10], int count, int steps, float softness, int stepsPerColor, bool wrap) {
  int n = max(count, 1);
  if (n == 1) return colors[0];
  float tc = clamp(t, 0.0, 1.0);
  if (wrap) tc = fract(tc);
  if (steps > 0) {
    float fSteps = float(steps);
    tc = floor(tc * fSteps) / max(fSteps - 1.0, 1.0);
    tc = clamp(tc, 0.0, 1.0);
  }
  float seg = tc * float(n - 1);
  int i0 = int(floor(seg));
  int i1 = i0 + 1;
  if (i1 > n - 1) i1 = wrap ? 0 : n - 1;
  float f = seg - float(i0);
  if (stepsPerColor > 1) {
    float spc = float(stepsPerColor);
    f = floor(f * spc) / max(spc - 1.0, 1.0);
    f = clamp(f, 0.0, 1.0);
  }
  float fw = fwidth(f);
  float s = max(softness, 0.0);
  f = smoothstep(0.5 - s - fw, 0.5 + s + fw, f);
  vec4 a = colors[i0];
  vec4 b = colors[i1];
  vec3 rgb = oklchMix(a.rgb, b.rgb, f);
  return vec4(rgb, mix(a.a, b.a, f));
}`,
  needs: ['oklchTransforms'],
})

export const colorBandingFix = helper({
  code: `
vec3 colorBandingFix(vec3 color) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return color + n / 256.0;
}

float colorBandingFix(float value) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return value + n / 256.0;
}`,
})
