// Output types from the codegen pipeline.

import type { BlendMode } from '@/shaders/core/types'

export type { BlendMode }

// Per-uniform metadata used by the runtime to bind live values and by export
// emitters to build a typed React/Vanilla API.
export interface GeneratedUniform {
  name: string
  type: UniformGlType
  default: unknown
  // Display name of the originating node (for the debug overlay + property panel).
  layerName: string
  // The original config or input field key on the node.
  originalName: string
  // For vec4Array uniforms, the static array length declared in GLSL.
  arrayLength?: number
  // For sampler2D uniforms (image-input or zSampler), companion meta/offset
  // uniforms are auto-emitted; this flag tells exporters about them.
  isSampler2D?: boolean
}

// GLSL types we need to track for codegen. Maps to `uniform <type> NAME;`.
export type UniformGlType =
  | 'float'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'int'
  | 'bool'
  | 'sampler2D'
  | 'vec4Array'

export interface GeneratedPass {
  fragmentShader: string
  readsPrevPass: boolean
  // Instance ids of the nodes contributing to this pass, in render order.
  nodeIds: string[]
  // 'js' marks the trivial GLSL pass that just samples a ProcessingNode's
  // CPU-computed output texture. 'glsl-render' marks a ProcessingNode's
  // optional follow-on render phase (sees the preprocessed image via u_prevPass).
  mode?: 'js' | 'glsl-render'
}

export interface GeneratedShader {
  passes: GeneratedPass[]
  vertexShader: string
  uniforms: GeneratedUniform[]
  // Concatenated fragment-shader source for display purposes only. Runtime
  // should iterate `passes`.
  fragmentShader: string
  // Source-string exports.
  typescript: string
  reactComponent: string
  vanillaJs: string
}
