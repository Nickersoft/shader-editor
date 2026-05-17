// Core types for the class-based shader composition system.
//
// `Node` (in ./node.svelte.ts) is the abstract base. Every primitive lives
// in its own file under src/shaders/<category>/ — categories mirror the
// bucketing at shaders.com/docs/components — and `export default`s a class
// extending GeneratorNode, EffectNode, or ProcessingNode. A `Scene` (in
// ./scene.svelte.ts) composes them into a Figma-style layer tree which the
// codegen pipeline at src/lib/codegen/ compiles into a runnable shader.

export type BlendMode =
  | "normal"
  | "add"
  | "multiply"
  | "screen"
  | "overlay"
  | "softLight"
  | "hardLight";

// Category buckets mirror the structure of shaders.com/docs/components.
// Each primitive declares one of these on its `meta.category`. The layer-stack
// UI uses CATEGORY_ORDER (in layer-stack.tsx) to group nodes in the picker.
export type Category =
  | "textures"
  | "shapes"
  | "shape-effects"
  | "stylize"
  | "interactive"
  | "distortion"
  | "blurs"
  | "adjustments";

export interface NodeMeta {
  name: string;
  description: string;
  // Accent color for the layer-stack UI chip.
  color: string;
  category: Category;
  defaultBlendMode: BlendMode;
  // Advisory only — UI uses this to render scalar previews monochrome and to
  // hint that a downstream `color-ramp`-style consumer is expected.
  outputKind?: "color" | "rgba" | "scalar";
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
import type { GlslHelperName } from "@/lib/codegen/helpers";

export type { GlslHelperName };

// Layer dependency declaration. Either a static list of helper names, or a
// function that derives the list from the shader's live inputs. The function
// form lets a layer that branches on an input enum (e.g. halftone classic vs
// CMYK) declare only the helpers the active branch actually uses.
//
// Names are checked against the GLSL_UTILS registry at compile time — typos
// like `'simplex2d'` (lowercase d) become TS errors.
export type GlslDependencies =
  | readonly GlslHelperName[]
  | ((inputs: Record<string, unknown>) => readonly GlslHelperName[]);

export interface GlslBlock {
  dependencies?: GlslDependencies;
  // Helper functions emitted at file scope (deduped across the pass).
  functions?: string;
  main: string;
}
