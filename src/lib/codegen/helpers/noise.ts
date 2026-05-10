import { helper } from "./types";

export const simplex2D = helper({
  code: `
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
}`,
});

/** Alias for simplex2D so verbatim ports compile without renaming. */
export const snoise = helper({
  code: `
float snoise(vec2 v) { return simplex2D(v); }`,
  needs: ["simplex2D"],
});

export const valueNoise = helper({
  code: `
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
}`,
  needs: ["hash21"],
});

export const fbm = helper({
  code: `
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
}`,
  needs: ["simplex2D"],
});

// === Noise-texture lookups (sample u_noiseTexture, the global TEXTURE15 binding) ===

export const noiseTextureRandomR = helper({
  code: `
float noiseTextureRandomR(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).r;
}`,
});

export const noiseTextureRandomGB = helper({
  code: `
vec2 noiseTextureRandomGB(vec2 p) {
  return texture(u_noiseTexture, floor(p) / 100.0 + 0.5).gb;
}`,
});

export const fiberNoise = helper({
  code: `
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
}`,
  needs: ["rotate"],
});

export const domainWarp = helper({
  code: `
vec2 domainWarp(vec2 uv, float n, float amplitude) {
  return uv + vec2(cos(n * TWO_PI), sin(n * TWO_PI)) * amplitude;
}`,
  needs: ["pi"],
});
