// Shader hierarchy for the composition system.
//
//   Shader (abstract)               glsl(), preprocess?(), this.inputs
//     ├─ StaticShader               adds: static schema (REQUIRED)
//     ├─ ProceduralShader           (defined in procedural-shader.svelte.ts)
//     └─ Effect (abstract)          adds: scope, appliesTo
//           ├─ StaticEffect         adds: static schema
//           └─ ProceduralEffect     (defined in procedural-effect.svelte.ts)
//
// Each StaticShader / StaticEffect subclass declares ONE Zod `static schema`
// using the pin DSL. Fields marked `.structural()` branch GLSL emission and
// trigger rebuilds; everything else hot-swaps as a uniform.
//
//   class Circle extends StaticShader<z.infer<typeof schema>> {
//     static readonly typeId = "circle";
//     static readonly meta: ShaderMeta = { name: "Circle", category: "shapes" };
//     static readonly schema = schema;
//     glsl() {
//       const r = this.uniformName("radius");
//       return { main: `float d = length(uv - 0.5); ... return vec4(...);` };
//     }
//   }

import type { z } from "zod";

import type { ExtraUniformDecl } from "@/lib/codegen/types";

import { makeId } from "@/lib/utils";

import type { SpatialControlsSpec } from "./spatial";
import type { BlendMode, GlslBlock, NodeMeta } from "./types";

export type ShaderMeta = NodeMeta;

/** Filter `string` index-signatures out of `keyof T` (see legacy `ConcreteKeys`). */
type ConcreteKeys<T> = string extends keyof T ? never : Extract<keyof T, string>;

/**
 * Sanitizes an instance id into a GLSL-safe identifier prefix. Used to
 * namespace a shader's uniforms (`u_<prefix>_<key>`) so multiple instances of
 * the same primitive don't collide.
 */
export function sanitizeName(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, "");
  if (/^[0-9]/.test(sanitized)) sanitized = "l" + sanitized;
  if (!sanitized) sanitized = "layer";
  return sanitized;
}

/** Static contract every Shader subclass implements (registry-visible). */
export interface ShaderClass<T extends Shader = Shader> {
  new (init?: ShaderInit): T;
  readonly typeId: string;
  readonly meta: ShaderMeta;
  readonly spatialControls?: SpatialControlsSpec;
}

/** Narrowed contract for static (schema-declaring) shaders. */
export interface StaticShaderClass<T extends StaticShader = StaticShader> extends ShaderClass<T> {
  readonly schema: z.ZodTypeAny;
}

export interface ShaderInit {
  id?: string;
  inputs?: Record<string, unknown>;
  blendMode?: BlendMode;
  opacity?: number;
  enabled?: boolean;
}

export interface SerializedShader {
  id: string;
  typeId: string;
  inputs: Record<string, unknown>;
  blendMode: BlendMode;
  opacity: number;
  enabled: boolean;
}

/**
 * Abstract root. Do not extend directly — use `StaticShader`, `ProceduralShader`,
 * `Effect`, `StaticEffect`, or `ProceduralEffect`.
 */
export abstract class Shader<I extends Record<string, unknown> = Record<string, unknown>> {
  static readonly typeId: string = "";
  static readonly meta: ShaderMeta;

  id: string;
  /**
   * Live value bag — fields parsed from `static schema` (for StaticShader /
   * StaticEffect) or otherwise the subclass's own runtime-derived inputs.
   * `$state`-reactive: edits propagate to bound UI and trigger uniform
   * rebinds (structural edits trigger a rebuild via `structuralKey()`).
   */
  inputs: I;
  blendMode: BlendMode;
  opacity: number;
  enabled: boolean;

  constructor(init: ShaderInit = {}) {
    const cls = this.constructor as ShaderClass;
    if (!cls.typeId) {
      throw new Error(
        `Shader subclass ${cls.name} is missing static typeId — set 'static typeId = "..."' on the class.`,
      );
    }

    this.id = init.id ?? makeId(cls.typeId);
    this.inputs = $state(this.parseInputs(init) as I);
    this.blendMode = $state(init.blendMode ?? cls.meta.defaultBlendMode);
    this.opacity = $state(init.opacity ?? 1);
    this.enabled = $state(init.enabled ?? true);
  }

  protected parseInputs(_init: ShaderInit): Record<string, unknown> {
    return {};
  }

  get cls(): ShaderClass {
    return this.constructor as ShaderClass;
  }

  get typeId(): string {
    return this.cls.typeId;
  }

  get meta(): ShaderMeta {
    return this.cls.meta;
  }

  /** @internal codegen-only. */
  prefixOverride: string | null = null;

  get prefix(): string {
    return this.prefixOverride ?? sanitizeName(this.id);
  }

  uniformName(key: ConcreteKeys<I>): string {
    return `u_${this.prefix}_${key}`;
  }

  /**
   * Structural fingerprint folded into the scene's rebuild key. Default
   * hashes the whole bag. Subclasses (StaticShader) refine this to skip
   * live-uniform fields once the structural-metadata walker is in place.
   * Container shaders (ProceduralShader / ProceduralEffect) override to
   * hash their graph topology separately.
   */
  structuralKey(): string {
    return JSON.stringify(this.inputs);
  }

  /**
   * Optional CPU-side preprocess step. Returns a data-URL the runtime uploads
   * as a texture; the result is bound via `u_prevPass` for the follow-on GLSL
   * pass. Shaders with a preprocess become two-pass: a JS pass that samples
   * the CPU-computed output, then an optional GLSL render pass.
   */
  preprocess?(): Promise<{ dataUrl: string } | null>;

  /**
   * Optional: declare uniforms beyond those derived from the static schema.
   * Used by container shaders (ProceduralShader / ProceduralEffect) whose
   * substructure contributes per-primitive uniforms.
   */
  extraUniforms?(): ExtraUniformDecl[];

  /**
   * Required: emit the GLSL body. `Effect` narrows the signature to permit
   * multi-pass arrays. ProceduralShader / ProceduralEffect auto-implement.
   */
  abstract glsl(): GlslBlock | GlslBlock[];

  /** Sub-shaders (rare). Used by container shaders for scene indexing. */
  subShaders?(): Shader[];

  toJSON(): SerializedShader {
    return {
      id: this.id,
      typeId: this.typeId,
      inputs: this.inputs,
      blendMode: this.blendMode,
      opacity: this.opacity,
      enabled: this.enabled,
    };
  }
}

/**
 * Generator shader whose inputs are declared via a Zod `static schema`. Most
 * hand-written shapes and textures (Circle, Webcam, image-texture, …) extend
 * this class.
 */
export abstract class StaticShader<
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Shader<I> {
  static readonly schema: z.ZodTypeAny;

  protected parseInputs(init: ShaderInit): Record<string, unknown> {
    const cls = this.constructor as StaticShaderClass;
    return cls.schema.parse(init.inputs ?? {}) as Record<string, unknown>;
  }

  /**
   * Structural fingerprint = hash of enum-string and `.structural()`-marked
   * inputs only. Numeric / vector / color / image fields are live uniforms
   * and must not trigger rebuilds.
   */
  structuralKey(): string {
    const cls = this.constructor as StaticShaderClass;
    const keys = collectStructuralKeys(cls.schema);
    if (keys.length === 0) return "";
    const bag = this.inputs as Record<string, unknown>;
    const parts: string[] = [];
    for (const k of keys) parts.push(`${k}=${JSON.stringify(bag[k])}`);
    return parts.join("|");
  }

  abstract glsl(): GlslBlock;
}

export type EffectScope = "layer" | "scene" | "both";
export type EffectAppliesTo = "shape" | "texture" | "any";

/**
 * Effect — receives the previous pass's output as `vec4 base` and always
 * triggers an FBO split. Can emit a single block or an array (each entry
 * becomes its own GLSL pass; later passes read the preceding via `u_prevPass`).
 */
export abstract class Effect<
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Shader<I> {
  static readonly scope: EffectScope = "both";
  static readonly appliesTo: readonly EffectAppliesTo[] = ["any"];

  abstract glsl(): GlslBlock | GlslBlock[];
}

/**
 * Effect with a hand-declared `static schema`. Hand-written effect primitives
 * (Blur, ChromaticAberration, …) extend this class.
 */
export abstract class StaticEffect<
  I extends Record<string, unknown> = Record<string, unknown>,
> extends Effect<I> {
  static readonly schema: z.ZodTypeAny;

  protected parseInputs(init: ShaderInit): Record<string, unknown> {
    const cls = this.constructor as unknown as StaticShaderClass;
    return cls.schema.parse(init.inputs ?? {}) as Record<string, unknown>;
  }

  structuralKey(): string {
    const cls = this.constructor as unknown as StaticShaderClass;
    const keys = collectStructuralKeys(cls.schema);
    if (keys.length === 0) return "";
    const bag = this.inputs as Record<string, unknown>;
    const parts: string[] = [];
    for (const k of keys) parts.push(`${k}=${JSON.stringify(bag[k])}`);
    return parts.join("|");
  }

  abstract glsl(): GlslBlock | GlslBlock[];
}

// Internal: walk a static schema, collecting field keys whose value branches
// GLSL emission. Cached per-schema since static schemas never change.
const structuralKeyCache = new WeakMap<z.ZodTypeAny, string[]>();

function collectStructuralKeys(schema: z.ZodTypeAny | undefined): string[] {
  if (!schema) return [];
  const cached = structuralKeyCache.get(schema);
  if (cached) return cached;
  // Lazy require to avoid pulling z at import time; schema is already z.ZodTypeAny.
  const out: string[] = [];
  const inner = unwrapZod(schema);
  if (!inner || !isZodObject(inner)) {
    structuralKeyCache.set(schema, out);
    return out;
  }
  const shape = (inner as unknown as { shape: Record<string, z.ZodTypeAny> }).shape;
  for (const [key, field] of Object.entries(shape)) {
    const inner2 = deepUnwrap(field);
    if (isZodEnum(inner2)) {
      out.push(key);
      continue;
    }
    const meta = (field.meta?.() ?? {}) as { structural?: boolean };
    if (meta.structural) out.push(key);
  }
  structuralKeyCache.set(schema, out);
  return out;
}

function unwrapZod(s: z.ZodTypeAny): z.ZodTypeAny | undefined {
  const u = (s as unknown as { unwrap?: () => z.ZodTypeAny }).unwrap;
  return typeof u === "function" ? u.call(s) : s;
}

function deepUnwrap(s: z.ZodTypeAny): z.ZodTypeAny {
  let cur = s;
  for (;;) {
    const u = (cur as unknown as { unwrap?: () => z.ZodTypeAny }).unwrap;
    if (typeof u !== "function") return cur;
    const next = u.call(cur) as z.ZodTypeAny | undefined;
    if (!next || next === cur) return cur;
    cur = next;
  }
}

function isZodObject(s: z.ZodTypeAny): boolean {
  return s.constructor.name === "ZodObject" || "shape" in (s as object);
}

function isZodEnum(s: z.ZodTypeAny): boolean {
  return s.constructor.name === "ZodEnum";
}

// === Type guards ===

export function isShader(value: unknown): value is Shader {
  return value instanceof Shader;
}

export function isStaticShader(value: unknown): value is StaticShader {
  return value instanceof StaticShader;
}

export function isEffect(value: unknown): value is Effect {
  return value instanceof Effect;
}

export function isStaticEffect(value: unknown): value is StaticEffect {
  return value instanceof StaticEffect;
}

/** Generator-side shaders (anything that isn't an Effect). */
export function isGenerator(value: unknown): value is Shader {
  return value instanceof Shader && !(value instanceof Effect);
}

/**
 * Type of a shader with a non-optional `preprocess()` hook. Narrowed by
 * `isProcessingShader` so callers can call `.preprocess()` without a guard.
 */
export type ProcessingShader = Shader & { preprocess: () => Promise<{ dataUrl: string } | null> };

/** A shader with a `preprocess()` hook — runs CPU work before its GLSL pass. */
export function isProcessingShader(value: unknown): value is ProcessingShader {
  return value instanceof Shader && typeof value.preprocess === "function";
}

export function getEffectScope(cls: ShaderClass): EffectScope {
  const scope = (cls as unknown as { scope?: EffectScope }).scope;
  return scope ?? "both";
}

export function getEffectAppliesTo(cls: ShaderClass): readonly EffectAppliesTo[] {
  const v = (cls as unknown as { appliesTo?: readonly EffectAppliesTo[] }).appliesTo;
  return v ?? ["any"];
}

export function generatorSourceKind(cls: ShaderClass): EffectAppliesTo {
  const cat = cls.meta.category;
  if (cat === "shapes") return "shape";
  if (cat === "textures") return "texture";
  return "any";
}
