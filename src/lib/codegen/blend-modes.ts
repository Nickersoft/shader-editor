// BlendMode → GLSL function-name mapping. The function bodies live in
// glsl-utils.ts and are emitted as ordinary dependencies.

import type { BlendMode } from '@/shaders/core/types'

export const BLEND_MODE_FUNCTIONS: Record<BlendMode, string> = {
  normal: 'blendNormal',
  add: 'blendAdd',
  multiply: 'blendMultiply',
  screen: 'blendScreen',
  overlay: 'blendOverlay',
  softLight: 'blendSoftLight',
  hardLight: 'blendHardLight',
}
