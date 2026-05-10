// Image-domain helpers: aspect-corrected sampling, separable Gaussians,
// edge-handling, and alpha-unpremultiplication used after distortion passes.

import { helper } from './types'

/**
 * Maps canvas-space UV in [0,1] to image-space UV honouring image aspect, fit
 * mode (0=cover, 1=contain, 2=fill), uniform scale, rotation (radians) and
 * pixel-space offset. Canvas aspect comes from u_resolution.
 *
 * Meta layout: (imgAspect, fitMode, scale, rotation). Offset is vec2 in UV.
 */
export const applySizing = helper({
  code: `
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
}`,
})

export const gaussian9 = helper({
  code: `
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
}`,
})

/**
 * 13-tap separable Gaussian (single direction). Mirrors upstream's blur kernel
 * weights: [0.056, 0.135, 0.265, 0.444, 0.654, 0.857, 1.0, 0.857, 0.654,
 *           0.444, 0.265, 0.135, 0.056], normalized to ~6.214 total.
 * `step` is the per-tap pixel offset along `direction` (pre-normalized).
 */
export const gaussian13 = helper({
  code: `
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
}`,
})

/**
 * Edge-handling helper. Modes (passed as int):
 *   0 = stretch (clamp to [0,1])
 *   1 = transparent (return vec4(0) outside)
 *   2 = mirror
 *   3 = wrap
 * Returns the resampled color from `src` after applying the edge policy to `uv`.
 */
export const applyEdgeHandling = helper({
  code: `
vec4 applyEdgeHandling(sampler2D src, vec2 uv, int mode) {
  if (mode == 1) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return vec4(0.0);
    }
    return texture(src, uv);
  }
  if (mode == 2) {
    vec2 m = mod(uv, 2.0);
    m = mix(m, 2.0 - m, step(1.0, m));
    return texture(src, m);
  }
  if (mode == 3) {
    return texture(src, fract(uv));
  }
  return texture(src, clamp(uv, 0.0, 1.0));
}`,
})

/**
 * Unpremultiplies alpha. Used after edge-handled samples in distortion/effect
 * nodes that need to operate on straight-alpha colors.
 */
export const unpremultiplyAlpha = helper({
  code: `
vec4 unpremultiplyAlpha(vec4 c) {
  return c.a > 1e-4 ? vec4(c.rgb / c.a, c.a) : c;
}`,
})
