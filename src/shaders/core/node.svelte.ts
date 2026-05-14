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
// Each subclass declares its identity via two parallel Zod schemas:
//   - `uniforms` → fields bound as GPU uniforms (numerics, vectors, colors,
//     samplers, palettes). Hot-swappable at runtime, no recompile.
//   - `config`   → editor-level state that branches the emitted GLSL source
//     (string enums like `edges`, halftone `style`, ring `softFalloff`).
//     Mutating `config` triggers a shader rebuild; mutating `uniforms`
//     just rebinds values. The default `structuralKey()` hashes `config`
//     so this distinction is enforced by construction.
//
//   class Circle extends GeneratorNode {
//     static typeId = 'circle'
//     static config = z.object({})
//     static uniforms = z.object({ radius: zFloat(0,1).default(0.3), ... })
//     static meta: NodeMeta = { name: 'Circle', category: 'shapes', ... }
//
//     glsl() {
//       const radius = this.uniformName('radius')
//       return { main: `float d = length(uv - 0.5); ... return vec4(...);` }
//     }
//   }

import type { z } from "zod";
import { makeId } from "@/lib/utils";
import type { SpatialControlsSpec } from "./spatial";
import type { BlendMode, GlslBlock, NodeMeta } from "./types";

/**
 * String-keyed fields of an inferred type, with string-indexed signatures
 * filtered out. Zod 4 infers `z.object({})` as `{ [k: string]: never }`,
 * whose `keyof` is `string` — that would poison `keyof C | keyof U` and
 * cause `uniformName(...)` to accept any string. This helper returns
 * `never` for index-signature shapes so empty schemas don't widen
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
// erased — generic config/uniforms types are only useful at the leaf class.
export interface NodeClass<T extends Node = Node> {
  new (init?: NodeInit): T;
  readonly typeId: string;
  readonly config: z.ZodTypeAny;
  readonly uniforms: z.ZodTypeAny;
  readonly meta: NodeMeta;
  readonly spatialControls?: SpatialControlsSpec;
}

/**
 * Loose init shape for `new MyNode(...)`. Construction is rarely typed at the
 * call site — most nodes are produced by deserialization or by the editor
 * UI, both of which carry plain JSON-shaped values. Typed access is via
 * `this.config` / `this.uniforms` (narrowed by the class's generics), so the
 * authoring ergonomics that matter — inside `glsl()` and `preprocess()` —
 * stay typesafe.
 *
 * `inputs` is accepted for backward compatibility with serialized scenes
 * predating the config/uniforms split — it is merged into the parse pool
 * alongside `config` and `uniforms`, and each schema picks its own keys.
 */
export interface NodeInit {
  id?: string;
  config?: Record<string, unknown>;
  uniforms?: Record<string, unknown>;
  /** @deprecated legacy serialized field; merged into the parse pool. */
  inputs?: Record<string, unknown>;
  blendMode?: BlendMode;
  opacity?: number;
  enabled?: boolean;
}

export interface SerializedNode {
  // Instance id — stable across save/load. Used to derive uniform-name
  // prefixes via `sanitizeName(id)`.
  id: string;
  // The class's `typeId` (e.g. 'circle', 'heatmap'). The Registry uses this
  // to dispatch deserialization.
  typeId: string;
  // Validated against the class's static `config` Zod schema. Holds editor-
  // level state that branches the emitted GLSL (string enums, structural
  // toggles). Mutating any field here triggers a shader rebuild.
  config: Record<string, unknown>;
  // Validated against the class's static `uniforms` Zod schema. Holds the
  // GPU-bound state (numerics, vectors, colors, samplers). Mutating any
  // field here just rebinds values — no recompile.
  uniforms: Record<string, unknown>;
  blendMode: BlendMode;
  opacity: number;
  enabled: boolean;
}

/**
 * Abstract base. Do not extend directly — use GeneratorNode, EffectNode, or
 * ProcessingNode.
 *
 * Generic over the inferred config + uniforms shapes:
 *   class Circle extends GeneratorNode<z.infer<typeof config>, z.infer<typeof uniforms>> { … }
 *
 * The generics give `this.config` and `this.uniforms` precise types and let
 * `uniformName(key)` enforce that `key` is an actual field on either schema.
 */
export abstract class Node<
  C extends Record<string, unknown> = Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>,
> {
  // === Static identity (set on each subclass) ===
  static readonly typeId: string = "";
  static readonly config: z.ZodTypeAny;
  static readonly uniforms: z.ZodTypeAny;
  static readonly meta: NodeMeta;

  // === Instance state ===
  // `id` is immutable after construction and need not be reactive.
  // Mutable fields use `$state` so direct mutation (composer or external
  // tooling) triggers Svelte reactivity without scene/layer reassignment.
  id: string;
  config: C;
  uniforms: U;
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

    this.id = init.id ?? makeId(cls.typeId);
    // Each schema parses from a merged pool of all three init buckets so
    // legacy scenes (which packed everything under `config` + `inputs`)
    // hydrate correctly. Zod silently drops keys it doesn't recognize, so
    // each schema picks only its own fields. New saves carry `config` and
    // `uniforms` cleanly separated; `inputs` is the back-compat door.
    const pool = { ...init.config, ...init.uniforms, ...init.inputs };
    this.config = $state(cls.config.parse(pool) as C);
    this.uniforms = $state(cls.uniforms.parse(pool) as U);
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
   * Returns the generated uniform name for a uniforms-schema or config-schema
   * key. The key is type-checked against the union of both schemas' fields,
   * so a typo or dropped field becomes a compile-time error inside `glsl()`:
   *
   *   const radius = this.uniformName('radius')   // ✓ if uniforms has `radius`
   *   const oops   = this.uniformName('radiu')    // TS error
   *
   * Config-schema keys are accepted in the type for the rare case where a
   * structural switch is also referenced by name in emitted GLSL — but only
   * uniforms-schema fields are actually bound at runtime.
   */
  uniformName(key: ConcreteKeys<C> | ConcreteKeys<U>): string {
    return `u_${this.prefix}_${key}`;
  }

  /**
   * Structural fingerprint folded into the scene's rebuild key. Default
   * hashes the whole `config` slice, which is the schema reserved for
   * fields that branch the emitted GLSL — so any mutation there triggers
   * a rebuild without per-node bookkeeping. Override only for container
   * nodes whose structure depends on something outside `config` (e.g.
   * `ProceduralField`, whose graph topology lives elsewhere).
   */
  structuralKey(): string {
    return JSON.stringify(this.config);
  }

  /**
   * Optional: declare uniforms beyond those derived from the static config
   * schema. Used by container-style nodes (e.g. ProceduralField) whose
   * substructure contributes per-element uniforms. Codegen calls this when
   * gathering uniforms for the runtime + fragment-shader declarations.
   *
   * Each declaration's `nameSuffix` is appended to `u_<prefix>_` to form the
   * full GLSL uniform name; `originalPath` tells the runtime where to read
   * the live value on the node.
   */
  extraUniforms?(): import("@/lib/codegen/types").ExtraUniformDecl[];

  /**
   * Optional: expose owned sub-nodes for scene indexing. Used by container
   * nodes (e.g. ProceduralField) whose children (stage nodes) are real Node
   * instances that need to be discoverable by id — for selection, property-
   * panel rendering, and config updates. Returns a live reactive array.
   */
  subNodes?(): Node[];

  toJSON(): SerializedNode {
    return {
      id: this.id,
      typeId: this.typeId,
      config: this.config,
      uniforms: this.uniforms,
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
  U extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, U> {
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
  U extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, U> {
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
  U extends Record<string, unknown> = Record<string, unknown>,
> extends Node<C, U> {
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

// Field-stage classes (FieldStageNode / CompositeStageNode and their helper
// types) lived here under the legacy stage-chain model. Phase 3 of the node-
// graph migration removed both — primitives are now plain registrations under
// `src/shaders/node-graph/primitives/` and don't reuse the Node class
// hierarchy.
