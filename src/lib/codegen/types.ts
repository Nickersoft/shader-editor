// Output types from the codegen pipeline.

import type { BlendMode } from "@/shaders/core/types";

export type { BlendMode };

// Per-uniform metadata used by the runtime to bind live values and by export
// emitters to build a typed React/Vanilla API.
export interface GeneratedUniform {
  name: string;
  type: UniformGlType;
  default: unknown;
  // Display name of the originating node (for the debug overlay + property panel).
  layerName: string;
  // The original config or input field key on the node.
  originalName: string;
  // For "extra" uniforms (e.g. stages inside a ProceduralField container), the
  // dotted path of property keys to traverse on the node — falls back to a flat
  // `originalName` lookup when omitted. Index segments are stringified numbers.
  // Example: ['stages', '0', 'config', 'scale'] → node.config.stages[0].config.scale.
  originalPath?: string[];
  // For vec4Array uniforms, the static array length declared in GLSL.
  arrayLength?: number;
  // For sampler2D uniforms (image-input or zSampler), companion meta/offset
  // uniforms are auto-emitted; this flag tells exporters about them.
  isSampler2D?: boolean;
}

// Declaration emitted by a Node's optional `extraUniforms()` hook — used by
// container-style nodes whose substructure (e.g. a chain of field stages)
// contributes uniforms beyond the static config schema.
export interface ExtraUniformDecl {
  // Suffix appended after `u_<prefix>_` to form the full GLSL uniform name.
  // Must be GLSL-identifier-safe (e.g. `s0_scale`).
  nameSuffix: string;
  type: UniformGlType;
  value: unknown;
  // Property path on the node to read the live value from (see GeneratedUniform).
  originalPath: string[];
  // Human-friendly key for the debug overlay / property panel.
  originalName: string;
  arrayLength?: number;
}

// GLSL types we need to track for codegen. Maps to `uniform <type> NAME;`.
export type UniformGlType =
  | "float"
  | "vec2"
  | "vec3"
  | "vec4"
  | "int"
  | "bool"
  | "sampler2D"
  | "vec4Array";

export interface GeneratedPass {
  fragmentShader: string;
  readsPrevPass: boolean;
  // Instance ids of the nodes contributing to this pass, in render order.
  nodeIds: string[];
  // 'js' marks the trivial GLSL pass that just samples a ProcessingNode's
  // CPU-computed output texture. 'glsl-render' marks a ProcessingNode's
  // optional follow-on render phase (sees the preprocessed image via u_prevPass).
  // 'compositor' marks the scene compositor pass that blends layer textures.
  mode?: "js" | "glsl-render" | "compositor";
  // When set, the pass writes its output into `layerTextures[commitToLayer]`
  // rather than into the ping-pong write target. Used to terminate a layer's
  // mini-chain so subsequent layers / the compositor can read the result.
  commitToLayer?: number;
  // When true, the runtime binds `u_layer_<i>` samplers to the layer-texture
  // pool before invoking `bindUniforms`. Set on the compositor pass.
  bindLayerTextures?: boolean;
}

export interface GeneratedShader {
  passes: GeneratedPass[];
  vertexShader: string;
  uniforms: GeneratedUniform[];
  // Concatenated fragment-shader source for display purposes only. Runtime
  // should iterate `passes`.
  fragmentShader: string;
  // Layers the runtime must allocate texture slots for, in the same order the
  // compositor expects (`u_layer_<i>` matches index `i`). Includes clip-mask
  // children — and is what the preview must drive `layerCount` /
  // `layerOpacities` from. May differ from `scene.enabledLayers` (which is
  // top-level only).
  layerRefs: { id: string }[];
  // Source-string exports.
  typescript: string;
  reactComponent: string;
  vanillaJs: string;
}

/**
 * Runtime-only subset of `GeneratedUniform`. Editor fields (`layerName`,
 * `originalName`) are stripped — the exported shader has no concept of layers
 * or config keys.
 */
export type UniformSpec = Pick<GeneratedUniform, "name" | "type" | "default" | "arrayLength">;

/**
 * Strip editor-only fields, leaving only what the portable runtime needs.
 * Filters out the runtime's intrinsic uniforms (`u_time`, `u_resolution`)
 * and ProcessingNode internals (`*_jsOutput`) — those are bound by the
 * runtime itself, not by the host.
 */
export function toUniformSpecs(uniforms: GeneratedUniform[]): UniformSpec[] {
  return uniforms
    .filter(
      (u) => u.name !== "u_time" && u.name !== "u_resolution" && !u.name.endsWith("_jsOutput"),
    )
    .map((u) => ({
      name: u.name,
      type: u.type,
      default: u.default,
      ...(u.arrayLength !== undefined ? { arrayLength: u.arrayLength } : {}),
    }));
}
