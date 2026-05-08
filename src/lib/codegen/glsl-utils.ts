// Shared GLSL utility functions.
//
// Each utility is exported as its own named const so primitives can import
// only what they reference, e.g.
//   import { simplex2D, fbm } from '@/lib/codegen/glsl-utils'
//   import * as glsl from '@/lib/codegen/glsl-utils'  // namespace import
//
// The aggregated `GLSL_UTILS` map is used by the codegen to splice the right
// bodies into each pass's fragment shader by dependency-name lookup.

// === Constants ===

export const pi = `
#ifndef TWO_PI
#define TWO_PI 6.28318530718
#endif
#ifndef PI
#define PI 3.14159265358979323846
#endif`

// === Hash / random ===

export const hash = `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}`

export const hash2 = `
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}`

export const hash3 = `
vec3 hash3(vec2 p) {
  vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.5, 183.3)),
                dot(p, vec2(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}`

// Better-distributed scalar hash, used by value-noise and grain layers.
export const hash21 = `
float hash21(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}`

// 2D-output hash with better distribution than two hash21 calls.
export const hash22 = `
vec2 hash22(vec2 p) {
  p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
  p += dot(p, p.yx + 19.19);
  return fract(vec2(p.x * p.y, p.x + p.y));
}`

// === Noise ===

export const simplex2D = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float simplex2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`

// Alias for simplex2D so verbatim ports compile without renaming.
export const snoise = `
float snoise(vec2 v) { return simplex2D(v); }`

export const valueNoise = `
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}`

export const fbm = `
float fbm(vec2 p, float octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  float maxOct = min(octaves, 8.0);
  for (float i = 0.0; i < 8.0; i += 1.0) {
    if (i >= maxOct) break;
    sum += amp * simplex2D(p * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}`

// === Noise-texture lookups (sample u_noiseTexture, the global TEXTURE15 binding) ===

export const noiseTextureRandomR = `
float noiseTextureRandomR(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).r;
}`

export const noiseTextureRandomGB = `
vec2 noiseTextureRandomGB(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).gb;
}`

export const fiberNoise = `
float fiberRandom(vec2 p) {
  return texture(u_noiseTexture, fract(floor(p) / 100.0)).b;
}

float fiberValueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = fiberRandom(i);
  float b = fiberRandom(i + vec2(1.0, 0.0));
  float c = fiberRandom(i + vec2(0.0, 1.0));
  float d = fiberRandom(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float fiberNoiseFbm(vec2 n, vec2 seedOffset) {
  float total = 0.0;
  float amplitude = 1.0;
  for (int i = 0; i < 4; i++) {
    n = rotate(n, 0.7);
    total += fiberValueNoise(n + seedOffset) * amplitude;
    n *= 2.0;
    amplitude *= 0.6;
  }
  return total;
}

float fiberNoise(vec2 uv, vec2 seedOffset) {
  float epsilon = 0.001;
  float n1 = fiberNoiseFbm(uv + vec2(epsilon, 0.0), seedOffset);
  float n2 = fiberNoiseFbm(uv - vec2(epsilon, 0.0), seedOffset);
  float n3 = fiberNoiseFbm(uv + vec2(0.0, epsilon), seedOffset);
  float n4 = fiberNoiseFbm(uv - vec2(0.0, epsilon), seedOffset);
  return length(vec2(n1 - n2, n3 - n4)) / (2.0 * epsilon);
}`

export const domainWarp = `
vec2 domainWarp(vec2 uv, float n, float amplitude) {
  return uv + vec2(cos(n * TWO_PI), sin(n * TWO_PI)) * amplitude;
}`

// === Blend modes ===

export const blendNormal = `
vec4 blendNormal(vec4 base, vec4 blend, float opacity) {
  return mix(base, blend, blend.a * opacity);
}`

export const blendAdd = `
vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
  return base + blend * opacity;
}`

export const blendMultiply = `
vec4 blendMultiply(vec4 base, vec4 blend, float opacity) {
  return mix(base, base * blend, opacity);
}`

export const blendScreen = `
vec4 blendScreen(vec4 base, vec4 blend, float opacity) {
  return mix(base, 1.0 - (1.0 - base) * (1.0 - blend), opacity);
}`

export const blendOverlay = `
vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, base.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`

export const blendSoftLight = `
vec4 blendSoftLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb + base.rgb * base.rgb * (1.0 - 2.0 * blend.rgb),
    sqrt(base.rgb) * (2.0 * blend.rgb - 1.0) + 2.0 * base.rgb * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`

export const blendHardLight = `
vec4 blendHardLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`

// === Math / utility ===

export const remap = `
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}`

export const rotate2D = `
vec2 rotate2D(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}`

// Alias kept alongside rotate2D so verbatim ports compile without rewriting.
export const rotate = `
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}`

// Aspect-corrected centered UV: y in [-0.5, 0.5], x scaled by aspect.
// Use this whenever a primitive needs to look the same on any canvas shape.
export const screenUv = `
vec2 screenUv(vec2 uv) {
  return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
}`

// Anti-aliased step using screen-space derivatives (WebGL2 / GLSL ES 3.00).
export const aastep = `
float aastep(float threshold, float value) {
  float afwidth = max(0.5 * fwidth(value), 1e-6);
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}`

// Smooth-min (continuous union) — k controls softness.
export const smin = `
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}`

export const luma = `
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }`

// === SDF primitives (Inigo Quilez canonical set) ===

export const sdCircle = `
float sdCircle(vec2 p, float r) { return length(p) - r; }`

export const sdBox = `
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}`

export const sdRoundedBox = `
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}`

export const sdEllipse = `
float sdEllipse(vec2 p, vec2 ab) {
  p = abs(p);
  if (p.x > p.y) { p = p.yx; ab = ab.yx; }
  float l = ab.y * ab.y - ab.x * ab.x;
  float m = ab.x * p.x / l;
  float m2 = m * m;
  float n = ab.y * p.y / l;
  float n2 = n * n;
  float c = (m2 + n2 - 1.0) / 3.0;
  float c3 = c * c * c;
  float q = c3 + m2 * n2 * 2.0;
  float d = c3 + m2 * n2;
  float g = m + m * n2;
  float co;
  if (d < 0.0) {
    float h = acos(q / c3) / 3.0;
    float s = cos(h);
    float t = sin(h) * sqrt(3.0);
    float rx = sqrt(-c * (s + t + 2.0) + m2);
    float ry = sqrt(-c * (s - t + 2.0) + m2);
    co = (ry + sign(l) * rx + abs(g) / (rx * ry) - m) / 2.0;
  } else {
    float h = 2.0 * m * n * sqrt(d);
    float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
    float u = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
    float rx = -s - u - c * 4.0 + 2.0 * m2;
    float ry = (s - u) * sqrt(3.0);
    float rm = sqrt(rx * rx + ry * ry);
    co = (ry / sqrt(rm - rx) + 2.0 * g / rm - m) / 2.0;
  }
  vec2 r = vec2(ab.x * co, ab.y * sqrt(1.0 - co * co));
  return length(r - p) * sign(p.y - r.y);
}`

export const sdEquilateralTriangle = `
float sdEquilateralTriangle(vec2 p, float r) {
  const float k = 1.7320508; // sqrt(3)
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}`

export const sdRegularPolygon = `
float sdRegularPolygon(vec2 p, float r, float n) {
  float an = 3.1415926 / n;
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  return length(p) * cos(bn) - r * cos(an);
}`

export const sdStar = `
float sdStar(vec2 p, float r, float n, float m) {
  float an = 3.1415926 / n;
  float en = 3.1415926 / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}`

export const sdSegment = `
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}`

export const sdCross = `
float sdCross(vec2 p, vec2 b, float r) {
  p = abs(p); p = (p.y > p.x) ? p.yx : p.xy;
  vec2 q = p - b;
  float k = max(q.y, q.x);
  vec2 w = (k > 0.0) ? q : vec2(b.y - p.x, -k);
  return sign(k) * length(max(w, 0.0)) + r;
}`

export const sdVesica = `
float sdVesica(vec2 p, float r, float d) {
  p = abs(p);
  float b = sqrt(r * r - d * d);
  return ((p.y - b) * d > p.x * b)
    ? length(p - vec2(0.0, b))
    : length(p - vec2(-d, 0.0)) - r;
}`

// === Color ===

export const rgb2hsv = `
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}`

export const hsv2rgb = `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`

// === Image-sampling helpers ===

// Maps canvas-space UV in [0,1] to image-space UV honouring image aspect, fit
// mode (0=cover, 1=contain, 2=fill), uniform scale, rotation (radians) and
// pixel-space offset. Canvas aspect comes from u_resolution.
// Meta layout: (imgAspect, fitMode, scale, rotation). Offset is vec2 in UV.
export const applySizing = `
vec2 applySizing(vec2 uv, vec4 meta, vec2 offset) {
  vec2 c = uv - 0.5 - offset;
  float canvasAspect = u_resolution.x / max(u_resolution.y, 1.0);
  float imgAspect = max(meta.x, 1e-4);
  float fitMode = meta.y;
  float scale = max(meta.z, 1e-4);
  float rot = meta.w;
  // Rotate around center.
  float ca = cos(rot);
  float sa = sin(rot);
  c = vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca);
  // Aspect correction.
  vec2 ratio = vec2(1.0);
  if (fitMode < 0.5) {
    if (canvasAspect > imgAspect) {
      ratio = vec2(1.0, imgAspect / canvasAspect);
    } else {
      ratio = vec2(canvasAspect / imgAspect, 1.0);
    }
  } else if (fitMode < 1.5) {
    if (canvasAspect > imgAspect) {
      ratio = vec2(imgAspect / canvasAspect, 1.0);
    } else {
      ratio = vec2(1.0, canvasAspect / imgAspect);
    }
  }
  c /= max(scale, 1e-4);
  c /= ratio;
  return c + 0.5;
}`

// === Color ramps ===

// Smooth/stepped color-ramp lookup over a fixed-size vec4 palette.
// steps=0 → smooth, steps>0 → quantised globally.
// stepsPerColor>0 → quantise within each color segment.
// softness controls blend sharpness (0=hard, 1=fully smooth).
// wrap=true → palette repeats; wrap=false → clamp at last color.
// The fixed array length 10 must match DEFAULT_VEC4_ARRAY_LENGTH in
// schema-introspection.ts.
export const colorRampLookup = `
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
}`

export const oklchTransforms = `
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
}`

export const oklchColorRampLookup = `
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
}`

export const colorBandingFix = `
vec3 colorBandingFix(vec3 color) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return color + n / 256.0;
}

float colorBandingFix(float value) {
  float n = fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5;
  return value + n / 256.0;
}`

// === Filters ===

export const gaussian9 = `
vec4 gaussian9(sampler2D src, vec2 uv, vec2 r) {
  vec4 c = texture(src, uv) * 0.227;
  c += texture(src, uv + vec2( r.x, 0.0)) * 0.194;
  c += texture(src, uv + vec2(-r.x, 0.0)) * 0.194;
  c += texture(src, uv + vec2(0.0,  r.y)) * 0.121;
  c += texture(src, uv + vec2(0.0, -r.y)) * 0.121;
  c += texture(src, uv + vec2( r.x,  r.y)) * 0.0707;
  c += texture(src, uv + vec2(-r.x,  r.y)) * 0.0707;
  c += texture(src, uv + vec2( r.x, -r.y)) * 0.0707;
  c += texture(src, uv + vec2(-r.x, -r.y)) * 0.0707;
  return c;
}`

// 13-tap separable Gaussian (single direction). Mirrors upstream's blur kernel
// weights: [0.056, 0.135, 0.265, 0.444, 0.654, 0.857, 1.0, 0.857, 0.654,
//           0.444, 0.265, 0.135, 0.056], normalized to ~6.214 total.
// `step` is the per-tap pixel offset along `direction` (pre-normalized).
export const gaussian13 = `
vec4 gaussian13(sampler2D src, vec2 uv, vec2 direction) {
  const float W0 = 1.0;
  const float W1 = 0.857;
  const float W2 = 0.654;
  const float W3 = 0.444;
  const float W4 = 0.265;
  const float W5 = 0.135;
  const float W6 = 0.056;
  const float TOTAL = W0 + 2.0 * (W1 + W2 + W3 + W4 + W5 + W6);
  vec4 acc = texture(src, uv) * W0;
  acc += texture(src, uv + direction * 1.0) * W1;
  acc += texture(src, uv - direction * 1.0) * W1;
  acc += texture(src, uv + direction * 2.0) * W2;
  acc += texture(src, uv - direction * 2.0) * W2;
  acc += texture(src, uv + direction * 3.0) * W3;
  acc += texture(src, uv - direction * 3.0) * W3;
  acc += texture(src, uv + direction * 4.0) * W4;
  acc += texture(src, uv - direction * 4.0) * W4;
  acc += texture(src, uv + direction * 5.0) * W5;
  acc += texture(src, uv - direction * 5.0) * W5;
  acc += texture(src, uv + direction * 6.0) * W6;
  acc += texture(src, uv - direction * 6.0) * W6;
  return acc / TOTAL;
}`

// Edge-handling helper. Modes (passed as int):
//   0 = stretch (clamp to [0,1])
//   1 = transparent (return vec4(0) outside)
//   2 = mirror
//   3 = wrap
// Returns the resampled color from `src` after applying the edge policy to `uv`.
export const applyEdgeHandling = `
vec4 applyEdgeHandling(sampler2D src, vec2 uv, int mode) {
  if (mode == 1) {
    // Transparent: return clear if outside.
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return vec4(0.0);
    }
    return texture(src, uv);
  }
  if (mode == 2) {
    // Mirror: triangle wave on each axis.
    vec2 m = mod(uv, 2.0);
    m = mix(m, 2.0 - m, step(1.0, m));
    return texture(src, m);
  }
  if (mode == 3) {
    // Wrap.
    return texture(src, fract(uv));
  }
  // Stretch (default).
  return texture(src, clamp(uv, 0.0, 1.0));
}`

// Unpremultiplies alpha. Mirrors upstream's `unpremultiplyAlpha` used after
// edge-handled samples in distortion/effect nodes.
export const unpremultiplyAlpha = `
vec4 unpremultiplyAlpha(vec4 c) {
  return c.a > 1e-4 ? vec4(c.rgb / c.a, c.a) : c;
}`

// === Aggregate lookup (codegen-internal) ===
//
// Maps dependency name → GLSL source. The codegen splices the right bodies
// into each pass's fragment shader by walking each node's `dependencies`
// array. Authors should import individual consts above; this map is for
// the compiler.

export const GLSL_UTILS: Record<string, string> = {
  pi,
  hash,
  hash2,
  hash3,
  hash21,
  hash22,
  simplex2D,
  snoise,
  valueNoise,
  fbm,
  noiseTextureRandomR,
  noiseTextureRandomGB,
  fiberNoise,
  domainWarp,
  blendNormal,
  blendAdd,
  blendMultiply,
  blendScreen,
  blendOverlay,
  blendSoftLight,
  blendHardLight,
  remap,
  rotate2D,
  rotate,
  screenUv,
  aastep,
  smin,
  luma,
  sdCircle,
  sdBox,
  sdRoundedBox,
  sdEllipse,
  sdEquilateralTriangle,
  sdRegularPolygon,
  sdStar,
  sdSegment,
  sdCross,
  sdVesica,
  rgb2hsv,
  hsv2rgb,
  applySizing,
  colorRampLookup,
  oklchTransforms,
  oklchColorRampLookup,
  colorBandingFix,
  gaussian9,
  gaussian13,
  applyEdgeHandling,
  unpremultiplyAlpha,
}
