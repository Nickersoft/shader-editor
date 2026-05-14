// GLSL blend-mode functions. The BlendMode → function-name mapping lives
// alongside the BlendMode type in `../blend-modes.ts`; this file ships the
// actual function bodies referenced by that map.
//
// All modes follow the same compositing contract:
//   t   = blend.a * opacity           (coverage of the layer at this pixel)
//   rgb = mix(base.rgb, <pure-mode>, t)
//   a   = t + base.a * (1.0 - t)      (source-over: opaque base stays opaque)
// This keeps the canvas alpha correct when a layer's alpha falls off
// (e.g. a vignetted god-rays layer over an opaque gradient).

import { helper } from "./types";

export const blendNormal = helper({
  code: `
vec4 blendNormal(vec4 base, vec4 blend, float opacity) {
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, blend.rgb, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendAdd = helper({
  code: `
vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, base.rgb + blend.rgb, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendMultiply = helper({
  code: `
vec4 blendMultiply(vec4 base, vec4 blend, float opacity) {
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, base.rgb * blend.rgb, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendScreen = helper({
  code: `
vec4 blendScreen(vec4 base, vec4 blend, float opacity) {
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, 1.0 - (1.0 - base.rgb) * (1.0 - blend.rgb), t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendOverlay = helper({
  code: `
vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
  vec3 pure = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, base.rgb)
  );
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, pure, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendSoftLight = helper({
  code: `
vec4 blendSoftLight(vec4 base, vec4 blend, float opacity) {
  vec3 pure = mix(
    2.0 * base.rgb * blend.rgb + base.rgb * base.rgb * (1.0 - 2.0 * blend.rgb),
    sqrt(base.rgb) * (2.0 * blend.rgb - 1.0) + 2.0 * base.rgb * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, pure, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});

export const blendHardLight = helper({
  code: `
vec4 blendHardLight(vec4 base, vec4 blend, float opacity) {
  vec3 pure = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  float t = blend.a * opacity;
  vec3 rgb = mix(base.rgb, pure, t);
  float a = t + base.a * (1.0 - t);
  return vec4(rgb, a);
}`,
});
