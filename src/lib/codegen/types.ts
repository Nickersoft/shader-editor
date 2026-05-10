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
  // For vec4Array uniforms, the static array length declared in GLSL.
  arrayLength?: number;
  // For sampler2D uniforms (image-input or zSampler), companion meta/offset
  // uniforms are auto-emitted; this flag tells exporters about them.
  isSampler2D?: boolean;
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
  // Source-string exports.
  typescript: string;
  reactComponent: string;
  vanillaJs: string;
}

/**
 * The shape that travels with each shader to the portable `shaderMount`
 * runtime. A subset of `GeneratedUniform` — only what the runtime needs to
 * bind a value: the GLSL uniform name, its type, and a default to fall back
 * on when the host doesn't supply one.
 *
 * Editor-only fields (`layerName`, `originalName`) are stripped because the
 * exported shader has no concept of "layers" or "config keys" — just GLSL.
 */
export interface UniformSpec {
  name: string;
  type: UniformGlType;
  default: unknown;
  /** For vec4Array uniforms, the static array length declared in GLSL. */
  arrayLength?: number;
}

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
