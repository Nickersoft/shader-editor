// GLSL blend-mode functions. The BlendMode → function-name mapping lives
// alongside the BlendMode type in `../blend-modes.ts`; this file ships the
// actual function bodies referenced by that map.

import { helper } from "./types";

export const blendNormal = helper({
  code: `
vec4 blendNormal(vec4 base, vec4 blend, float opacity) {
  return mix(base, blend, blend.a * opacity);
}`,
});

export const blendAdd = helper({
  code: `
vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
  return base + blend * opacity;
}`,
});

export const blendMultiply = helper({
  code: `
vec4 blendMultiply(vec4 base, vec4 blend, float opacity) {
  return mix(base, base * blend, opacity);
}`,
});

export const blendScreen = helper({
  code: `
vec4 blendScreen(vec4 base, vec4 blend, float opacity) {
  return mix(base, 1.0 - (1.0 - base) * (1.0 - blend), opacity);
}`,
});

export const blendOverlay = helper({
  code: `
vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, base.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`,
});

export const blendSoftLight = helper({
  code: `
vec4 blendSoftLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb + base.rgb * base.rgb * (1.0 - 2.0 * blend.rgb),
    sqrt(base.rgb) * (2.0 * blend.rgb - 1.0) + 2.0 * base.rgb * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`,
});

export const blendHardLight = helper({
  code: `
vec4 blendHardLight(vec4 base, vec4 blend, float opacity) {
  vec4 result;
  result.rgb = mix(
    2.0 * base.rgb * blend.rgb,
    1.0 - 2.0 * (1.0 - base.rgb) * (1.0 - blend.rgb),
    step(0.5, blend.rgb)
  );
  result.a = blend.a;
  return mix(base, result, opacity);
}`,
});
