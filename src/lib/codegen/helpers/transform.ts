// Math + UV-space transform helpers — small enough to live together.

import { helper } from "./types";

export const remap = helper({
  code: `
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}`,
});

export const rotate2D = helper({
  code: `
vec2 rotate2D(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}`,
});

/** Alias kept alongside rotate2D so verbatim ports compile without rewriting. */
export const rotate = helper({
  code: `
vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}`,
});

/**
 * Aspect-corrected centered UV: y in [-0.5, 0.5], x scaled by aspect.
 * Use this whenever a primitive needs to look the same on any canvas shape.
 */
export const screenUv = helper({
  code: `
vec2 screenUv(vec2 uv) {
  return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
}`,
});

/** Anti-aliased step using screen-space derivatives (WebGL2 / GLSL ES 3.00). */
export const aastep = helper({
  code: `
float aastep(float threshold, float value) {
  float afwidth = max(0.5 * fwidth(value), 1e-6);
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}`,
});

/** Smooth-min (continuous union) — k controls softness. */
export const smin = helper({
  code: `
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}`,
});

export const luma = helper({
  code: `
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }`,
});

/**
 * Sin-blended dual-sample weight for seamlessly looping noise animations.
 * When an effect samples noise twice — once at `t`, once at `t + duration*0.5`
 * — and mixes by this weight, the result repeats perfectly every `duration`
 * seconds. Pass `duration <= 0` to disable looping (returns 0 → no blend).
 */
export const seamlessLoopBlend = helper({
  code: `
float seamlessLoopBlend(float t, float duration) {
  if (duration <= 0.0) return 0.0;
  return 0.5 + 0.5 * sin(t * PI / duration - 0.5 * PI);
}`,
  needs: ["pi"],
});
