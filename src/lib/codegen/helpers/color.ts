// Color-space transforms, ramp lookups, and grading helpers.

import { helper } from "./types";

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
});

export const hsv2rgb = helper({
  code: `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`,
});

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
});

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
  needs: ["pi"],
});

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
  needs: ["oklchTransforms"],
});

// HSL ↔ RGB and CIELAB ↔ RGB conversions, plus a unified mixInColorSpace
// dispatcher used by primitives that expose a `colorSpace` knob (e.g. aurora).
// Hue interpolation in HSL/HSV/LCh goes the short way around the wheel so
// magenta→cyan doesn't pass through dull greens.

export const hslRgbTransforms = helper({
  code: `
vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float L = (maxC + minC) * 0.5;
  float d = maxC - minC;
  float H = 0.0;
  float S = 0.0;
  if (d > 1e-6) {
    S = (L > 0.5) ? d / max(2.0 - maxC - minC, 1e-6) : d / max(maxC + minC, 1e-6);
    if (maxC == c.r) H = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxC == c.g) H = (c.b - c.r) / d + 2.0;
    else H = (c.r - c.g) / d + 4.0;
    H /= 6.0;
  }
  return vec3(H, S, L);
}

float hslHueToRgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float H = hsl.x;
  float S = hsl.y;
  float L = hsl.z;
  if (S <= 1e-6) return vec3(L);
  float q = L < 0.5 ? L * (1.0 + S) : L + S - L * S;
  float p = 2.0 * L - q;
  return vec3(hslHueToRgb(p, q, H + 1.0 / 3.0), hslHueToRgb(p, q, H), hslHueToRgb(p, q, H - 1.0 / 3.0));
}

float mixHue01(float h1, float h2, float t) {
  float d = mod(h2 - h1 + 0.5, 1.0) - 0.5;
  return mod(h1 + t * d + 1.0, 1.0);
}

vec3 hslMix(vec3 c1, vec3 c2, float t) {
  vec3 a = rgb2hsl(c1);
  vec3 b = rgb2hsl(c2);
  float H = (a.y > 1e-4 && b.y > 1e-4) ? mixHue01(a.x, b.x, t) : mix(a.x, b.x, t);
  return clamp(hsl2rgb(vec3(H, mix(a.y, b.y, t), mix(a.z, b.z, t))), 0.0, 1.0);
}

vec3 hsvMix(vec3 c1, vec3 c2, float t) {
  vec3 a = rgb2hsv(c1);
  vec3 b = rgb2hsv(c2);
  float H = (a.y > 1e-4 && b.y > 1e-4) ? mixHue01(a.x, b.x, t) : mix(a.x, b.x, t);
  return clamp(hsv2rgb(vec3(H, mix(a.y, b.y, t), mix(a.z, b.z, t))), 0.0, 1.0);
}`,
  needs: ["rgb2hsv", "hsv2rgb"],
});

// CIELAB / CIELCh ("lch" option). D65 white point, sRGB primaries. The
// pivot transform is the standard CIE 1976 formulation; outputs land back
// in sRGB after the inverse passes.
export const cielabTransforms = helper({
  code: `
vec3 srgbToXyz(vec3 srgb) {
  vec3 lin = srgbToLinear(srgb);
  return vec3(
    0.4124564 * lin.r + 0.3575761 * lin.g + 0.1804375 * lin.b,
    0.2126729 * lin.r + 0.7151522 * lin.g + 0.0721750 * lin.b,
    0.0193339 * lin.r + 0.1191920 * lin.g + 0.9503041 * lin.b
  );
}

vec3 xyzToSrgb(vec3 xyz) {
  vec3 lin = vec3(
    3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z,
    -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z,
    0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z
  );
  return linearToSrgb(lin);
}

float labF(float v) {
  return v > 0.008856 ? pow(v, 1.0 / 3.0) : (7.787 * v + 16.0 / 116.0);
}

float labFinv(float v) {
  float v3 = v * v * v;
  return v3 > 0.008856 ? v3 : (v - 16.0 / 116.0) / 7.787;
}

vec3 xyzToLab(vec3 xyz) {
  vec3 ref = vec3(0.95047, 1.0, 1.08883);
  vec3 n = xyz / ref;
  vec3 f = vec3(labF(n.x), labF(n.y), labF(n.z));
  return vec3(116.0 * f.y - 16.0, 500.0 * (f.x - f.y), 200.0 * (f.y - f.z));
}

vec3 labToXyz(vec3 lab) {
  float y = (lab.x + 16.0) / 116.0;
  float x = lab.y / 500.0 + y;
  float z = y - lab.z / 200.0;
  vec3 ref = vec3(0.95047, 1.0, 1.08883);
  return ref * vec3(labFinv(x), labFinv(y), labFinv(z));
}

vec3 labToLch(vec3 lab) {
  float C = length(lab.yz);
  float H = atan(lab.z, lab.y);
  return vec3(lab.x, C, H);
}

vec3 lchToLab(vec3 lch) {
  return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 srgbToLch(vec3 srgb) { return labToLch(xyzToLab(srgbToXyz(srgb))); }
vec3 lchToSrgb(vec3 lch) { return xyzToSrgb(labToXyz(lchToLab(lch))); }

vec3 lchMix(vec3 c1, vec3 c2, float t) {
  vec3 a = srgbToLch(c1);
  vec3 b = srgbToLch(c2);
  // Shortest hue path in radians.
  float dh = mod(b.z - a.z + PI, TWO_PI) - PI;
  vec3 m = vec3(mix(a.x, b.x, t), mix(a.y, b.y, t), a.z + t * dh);
  return clamp(lchToSrgb(m), 0.0, 1.0);
}

vec3 oklabMix(vec3 c1, vec3 c2, float t) {
  vec3 a = LrgbToOklab(srgbToLinear(c1));
  vec3 b = LrgbToOklab(srgbToLinear(c2));
  return clamp(linearToSrgb(OklabToLrgb(mix(a, b, t))), 0.0, 1.0);
}

vec3 linearLightMix(vec3 c1, vec3 c2, float t) {
  return clamp(linearToSrgb(mix(srgbToLinear(c1), srgbToLinear(c2), t)), 0.0, 1.0);
}

// 0=linear, 1=oklch, 2=oklab, 3=hsl, 4=hsv, 5=lch. Branch is uniform-uniform
// per draw call since the space id is a uniform — no per-fragment penalty.
vec3 mixInColorSpace(vec3 c1, vec3 c2, float t, int space) {
  if (space == 1) return oklchMix(c1, c2, t);
  if (space == 2) return oklabMix(c1, c2, t);
  if (space == 3) return hslMix(c1, c2, t);
  if (space == 4) return hsvMix(c1, c2, t);
  if (space == 5) return lchMix(c1, c2, t);
  return linearLightMix(c1, c2, t);
}`,
  needs: ["pi", "oklchTransforms", "hslRgbTransforms"],
});

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
});
