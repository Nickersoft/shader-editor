// Node hierarchy for the shader composition system.
//
//   Node                    abstract base; instance state + serialization
//     ├─ GeneratorNode      produces a color from `uv` alone
//     ├─ EffectNode         receives the previous pass; triggers FBO split
//     └─ ProcessingNode     CPU preprocessor (heatmap, liquid metal, etc.)
//
// The codegen splits passes by class:
//   - A run of GeneratorNodes collapses into one fragment shader
//   - Each EffectNode triggers an FBO split — its glsl() main sees `vec4 prev`
//   - Each ProcessingNode is a pipeline boundary (CPU pass + optional GLSL render)
//
// Each subclass declares its identity via static fields:
//
//   class Circle extends GeneratorNode {
//     static typeId = 'circle'
//     static config = z.object({ radius: zFloat(0,1).default(0.3), ... })
//     static inputs = z.object({})
//     static meta: NodeMeta = { name: 'Circle', category: 'shapes', ... }
//
//     declare config: z.infer<typeof Circle.config>
//
//     glsl() {
//       const c = this.config
//       const radius = this.uniformName('radius')
//       return { main: `float d = length(uv - 0.5); ... return vec4(...);` }
//     }
//   }

import type { z } from "zod";
import type { BlendMode, GlslBlock, NodeMeta, SerializedNode } from "./types";

/**
 * String-keyed fields of an inferred type, with string-indexed signatures
 * filtered out. Zod 4 infers `z.object({})` as `{ [k: string]: never }`,
 * whose `keyof` is `string` — that would poison `keyof C | keyof I` and
 * cause `uniformName(...)` to accept any string. This helper returns
 * `never` for index-signature shapes so empty input schemas don't widen
 * the constraint.
 */
type ConcreteKeys<T> = string extends keyof T ? never : Extract<keyof T, string>;

/**
 * Sanitizes a node id into a GLSL-safe identifier prefix. Used to namespace
 * a node's uniforms (`u_<prefix>_<configKey>`) so multiple instances of the
 * same primitive don't collide.
 */
export function sanitizeName(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, "");
  if (/^[0-9]/.test(sanitized)) sanitized = "l" + sanitized;
  if (!sanitized) sanitized = "layer";
  return sanitized;
}

// Static contract every Node subclass implements. Used by the Registry to
// instantiate nodes from `SerializedNode`. The Registry stores nodes
// erased — generic config/inputs types are only useful at the leaf class.
export interface NodeClass<T extends Node = Node> {
  new (init?: NodeInit): T;
  readonly typeId: string;
  readonly config: z.ZodTypeAny;
  readonly inputs: z.ZodTypeAny;
  readonly meta: NodeMeta;
}

/**
 * Loose init shape for `new MyNode(...)`. Construction is rarely typed at the
 * call site — most nodes are produced by deserialization or by the editor
 * UI, both of which carry plain JSON-shaped values. Typed access is via
 * `this.config` / `this.inputs` (narrowed by the class's generics), so the
 * authoring ergonomics that matter — inside `glsl()` and `preprocess()` —
 * stay typesafe.
 */
export interface NodeInit {
  id?: string;
  config?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  blendMode?: BlendMode;
  opacity?: number;
  enabled?: boolean;
}

let instanceCounter = 0;
function defaultId(typeId: string): string {
  instanceCounter += 1;
  return `${typeId}-${Date.now().toString(36)}-${instanceCounter}`;
}

/**
 * Abstract base. Do not extend directly — use GeneratorNode, EffectNode, or
 * ProcessingNode.
 *
 * Generic over the inferred config + input shapes:
 *   class Circle extends GeneratorNode<z.infer<typeof config>, z.infer<typeof inputs>> { … }
 *
 * The generics give `this.config` and `this.inputs` precise types and let
 * `uniformName(key)` enforce that `key` is an actual field on either schema.
 */
export abstract class Node<
  C extends Record<string, unknown> = Record<string, unknown>,
  I extends Record<string, unknown> = Record<string, unknown>,
> {
  // === Static identity (set on each subclass) ===
  static readonly typeId: string = "";
  static readonly config: z.ZodTypeAny;
  static readonly inputs: z.ZodTypeAny;
  static readonly meta: NodeMeta;

  // === Instance state ===
  // `id` is immutable after construction and need not be reactive.
  // Mutable fields use `$state` so direct mutation (composer or external
  // tooling) triggers Svelte reactivity without scene/layer reassignment.
  id: string;
  config: C;
  inputs: I;
  blendMode: BlendMode;
  opacity: number;
  enabled: boolean;

  constructor(init: NodeInit = {}) {
    const cls = this.constructor as NodeClass;
    if (!cls.typeId) {
      throw new Error(
        `Node subclass ${cls.name} is missing static typeId — set 'static typeId = "..."' on the class.`,
      );
    }

    this.id = init.id ?? defaultId(cls.typeId);
    // Validate or fall back to schema defaults. Zod's .parse on an empty
    // object hydrates fields with their .default(...) values.
    this.config = $state((init.config ? cls.config.parse(init.config) : cls.config.parse({})) as C);
    this.inputs = $state((init.inputs ? cls.inputs.parse(init.inputs) : cls.inputs.parse({})) as I);
    this.blendMode = $state(init.blendMode ?? cls.meta.defaultBlendMode);
    this.opacity = $state(init.opacity ?? 1);
    this.enabled = $state(init.enabled ?? true);
  }

  /** Static metadata accessor for the instance's class. */
  get cls(): NodeClass {
    return this.constructor as NodeClass;
  }

  get typeId(): string {
    return this.cls.typeId;
  }

  get meta(): NodeMeta {
    return this.cls.meta;
  }

  /**
   * Override for the GLSL uniform prefix. The codegen sets this to a
   * human-readable slug (e.g. `voronoi`, `circle2`) before fragment emission,
   * so the emitted shader uses readable names. When unset, falls back to the
   * sanitized node id (which is stable but cryptic).
   *
   * @internal codegen-only.
   */
  prefixOverride: string | null = null;

  /** GLSL-safe prefix for this instance's uniforms. */
  get prefix(): string {
    return this.prefixOverride ?? sanitizeName(this.id);
  }

  /**
   * Returns the generated uniform name for a config or input key. The key is
   * type-checked against the union of both schemas' fields, so a typo or
   * dropped field becomes a compile-time error inside `glsl()`:
   *
   *   const radius = this.uniformName('radius')   // ✓ if config has `radius`
   *   const oops   = this.uniformName('radiu')    // TS error
   */
  uniformName(key: ConcreteKeys<C> | ConcreteKeys<I>): string {
    return `u_${this.prefix}_${key}`;
  }

  /**
   * Discriminator for config fields that change the GLSL source (not just
   * uniform values). The shader-preview pipeline only rebuilds when the
   * scene's "structural key" changes; for nodes whose `glsl()` branches on
   * config (e.g. Gradient `type`, Halftone `style`), override this to return
   * a stable string of the relevant config slice. Default = no contribution.
   */
  structuralKey(): string {
    return "";
  }

  toJSON(): SerializedNode {
    return {
      id: this.id,
      typeId: this.typeId,
      config: this.config,
      inputs: this.inputs,
      blendMode: this.blendMode,
      opacity: this.opacity,
      enabled: this.enabled,
    };
  }
}

/**
 * Produces a color from `uv` alone (or sampled global resources like
 * `u_noiseTexture`). Multiple consecutive GeneratorNodes co-render in one
 * fragment shader and are blended together by the codegen.
 */
export abstract class GeneratorNode<
  C extends Record<string, unknown> = Record<string, unknown>,
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, I> {
  abstract glsl(): GlslBlock;
}

/**
 * Where an EffectNode may be attached in the Scene model:
 *   'layer' — only inside a Layer's `effects[]` (acts on the layer texture).
 *   'scene' — only on `scene.postEffects[]` (acts on the composited canvas;
 *             often required by effects that read `u_prevFrame` for cross-frame
 *             state, e.g. cursor ripples or particle trails).
 *   'both'  — works in either position (the default).
 */
export type EffectScope = "layer" | "scene" | "both";

/**
 * What kind of layer source an EffectNode is allowed to attach to.
 *   'shape'   — needs the parent layer's SDF/alpha geometry (Glass, Crystal,
 *               Emboss, Neon, Smoke Fill).
 *   'texture' — needs an image-domain input (rare; reserved for future).
 *   'any'     — works on either (default — blurs, distortions, adjustments).
 */
export type EffectAppliesTo = "shape" | "texture" | "any";

/**
 * Receives the previous pass output. Always triggers an FBO split. Inside
 * `main`, the previous color is bound to `vec4 base` and the previous-pass
 * texture is `u_prevPass`.
 *
 * `glsl()` may return either a single GlslBlock (one pass) or an array of
 * blocks (each becomes its own GLSL pass; each subsequent pass reads the
 * preceding pass's output via `u_prevPass`). Use the array form for inherently
 * multi-stage effects like a true separable Gaussian blur (horizontal then
 * vertical) or an iterative simulation step.
 */
export abstract class EffectNode<
  C extends Record<string, unknown> = Record<string, unknown>,
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, I> {
  /**
   * Attachment scope. Subclasses override to restrict where they may be
   * placed (e.g. cursor-driven effects that need full canvas state set
   * `scope = 'scene'`).
   */
  static readonly scope: EffectScope = "both";
  /**
   * Source-kind constraint. Subclasses override to declare what generator
   * type they require — e.g. 'shape' for `shape-effects`.
   */
  static readonly appliesTo: readonly EffectAppliesTo[] = ["any"];
  abstract glsl(): GlslBlock | GlslBlock[];
}

/**
 * CPU-side preprocessor. Runs once per input change (not per frame); the
 * result is uploaded as a texture and consumed by the next pass.
 *
 * Optionally provides a follow-on GLSL render pass via `glsl()` — the same
 * instance owns both phases. The render block sees the preprocessed image
 * via `u_prevPass`.
 */
export abstract class ProcessingNode<
  C extends Record<string, unknown> = Record<string, unknown>,
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, I> {
  abstract preprocess(): Promise<{ dataUrl: string } | null>;
  glsl?(): GlslBlock;
}

/** Type guard: GLSL-only node (Generator or Effect). */
export function isGlslNode(node: Node): node is GeneratorNode | EffectNode {
  return node instanceof GeneratorNode || node instanceof EffectNode;
}

export function isGeneratorNode(node: Node): node is GeneratorNode {
  return node instanceof GeneratorNode;
}

export function isEffectNode(node: Node): node is EffectNode {
  return node instanceof EffectNode;
}

export function isProcessingNode(node: Node): node is ProcessingNode {
  return node instanceof ProcessingNode;
}

/**
 * Read the static `scope` field from an EffectNode subclass. Returns 'both'
 * when the field isn't declared (the default). Generators / Processing nodes
 * have no scope concept and return 'both' as a no-op.
 */
export function getEffectScope(cls: NodeClass): EffectScope {
  const scope = (cls as unknown as { scope?: EffectScope }).scope;
  return scope ?? "both";
}

/**
 * Read the static `appliesTo` field from an EffectNode subclass. Returns
 * `['any']` when not declared. Generators / Processing nodes have no
 * applicability constraint and return `['any']` as a no-op.
 */
export function getEffectAppliesTo(cls: NodeClass): readonly EffectAppliesTo[] {
  const v = (cls as unknown as { appliesTo?: readonly EffectAppliesTo[] }).appliesTo;
  return v ?? ["any"];
}

/**
 * Map a generator's category to the source-kind used for effect-applicability
 * checks. Anything outside `shapes`/`textures` is treated as 'any' so it
 * doesn't accidentally exclude effects.
 */
export function generatorSourceKind(cls: NodeClass): EffectAppliesTo {
  const cat = cls.meta.category;
  if (cat === "shapes") return "shape";
  if (cat === "textures") return "texture";
  return "any";
}
