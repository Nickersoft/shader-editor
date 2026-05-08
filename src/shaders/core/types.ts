// Core types for the class-based shader composition system.
//
// `Node` (in ./node.ts) is the abstract base. Every primitive lives in its
// own file under src/shaders/<category>/ — categories mirror the bucketing
// at shaders.com/docs/components — and `export default`s a class extending
// GeneratorNode, EffectNode, or ProcessingNode.
//
// `ShaderChain` (in ./chain.ts) holds an ordered list of node instances and
// exposes `.pipe()` for fluent composition. The codegen pipeline at
// src/lib/codegen/ consumes a chain and emits a runnable + exportable
// shader.

export type BlendMode =
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'softLight'
  | 'hardLight'

// Category buckets mirror the structure of shaders.com/docs/components.
// Each primitive declares one of these on its `meta.category`. The layer-stack
// UI uses CATEGORY_ORDER (in layer-stack.tsx) to group nodes in the picker.
export type Category =
  | 'textures'
  | 'shapes'
  | 'shape-effects'
  | 'stylize'
  | 'interactive'
  | 'distortion'
  | 'blurs'
  | 'adjustments'

export interface NodeMeta {
  name: string
  description: string
  // Accent color for the layer-stack UI chip.
  color: string
  category: Category
  defaultBlendMode: BlendMode
  // Advisory only — UI uses this to render scalar previews monochrome and to
  // hint that a downstream `color-ramp`-style consumer is expected.
  outputKind?: 'color' | 'rgba' | 'scalar'
}

// A GLSL contribution emitted by GeneratorNode.glsl() or EffectNode.glsl().
//
// `main` is a sequence of GLSL statements ending in a `return vec4 ...;`.
// The codegen wraps it in:
//   vec4 layer_<id>(vec2 uv, vec4 base) { ...main... }
// For EffectNodes the wrapper signature becomes:
//   vec4 layer_<id>(vec2 uv, vec4 prev) { ...main... }
//
// Authors compose the `main` string from the node's typed config — there are
// no `{{name}}` placeholders in this system. Reference uniforms by their
// generated names (`u_<prefix>_<configKey>`) when emitting GLSL via
// `node.uniformName('configKey')`.
export interface GlslBlock {
  dependencies?: string[]
  // Helper functions emitted at file scope (deduped across the pass).
  functions?: string
  main: string
}

export interface SerializedNode {
  // Instance id — stable across save/load. Used to derive uniform-name
  // prefixes via `sanitizeName(id)`.
  id: string
  // The class's `typeId` (e.g. 'circle', 'heatmap'). The Registry uses this
  // to dispatch deserialization.
  typeId: string
  // Validated against the class's static `config` Zod schema.
  config: Record<string, unknown>
  // Validated against the class's static `inputs` Zod schema. May be empty.
  inputs: Record<string, unknown>
  blendMode: BlendMode
  opacity: number
  enabled: boolean
}

export interface SerializedChain {
  // Ordered list of nodes. Order is the layer-stack render order.
  nodes: SerializedNode[]
}
