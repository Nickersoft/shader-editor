// Primitive registry. Each primitive is an instance of a `BasePrimitive`
// subclass that declares its pin shape, optional per-instance config schema,
// GLSL emit method, and palette metadata.
//
// Primitives are registered at module load via `register(MyPrimitive)` from
// their own files under primitives/. The node-graph emit loop looks each one
// up by typeId.

import { z } from "zod";
import type { GlslHelperName } from "@/shaders/core/types";
import type { SpatialControl } from "@/shaders/core/spatial";
import { pinSpecsFromSchema } from "./pins";
import type { GraphNode, PinSpec, PinType } from "./types";

/**
 * Per-emit context handed to `emit()`. The three id-set generics narrow the
 * `inputs` / `outputs` / `uniforms` records so primitives get typed access to
 * their own pin keys (`ctx.inputs.x` typo-checks). Each generic is a record
 * shape — `BasePrimitive<C, In, Out>` derives them from the primitive's Zod
 * pin schemas via `z.infer`. The mapped types here erase the inferred value
 * types and replace them with `string`, since at GLSL-emit time every pin
 * value is a source-code expression rather than a runtime number/vector.
 */
export interface EmitContext<
  In extends Record<string, unknown> = Record<string, unknown>,
  Out extends Record<string, unknown> = Record<string, unknown>,
  U extends Record<string, unknown> = Record<string, unknown>,
> {
  /** GLSL expressions for each input pin, already resolved (default literal if unwired). */
  inputs: { readonly [K in keyof In]: string };
  /** Unique local-variable name for each output pin. Emit must assign these. */
  outputs: { readonly [K in keyof Out]: string };
  /** Uniform names for parameters declared by this primitive (e.g. ColorRamp colors). */
  uniforms: { readonly [K in keyof U]: string };
  /** Per-instance config (validated against the primitive's config schema). */
  config: Record<string, unknown>;
  /** Register a GLSL helper dependency to be included in the fragment shader. */
  addDependency: (name: GlslHelperName) => void;
}

export interface EmitResult {
  /** GLSL statements that declare each output local. Concatenated by the emitter. */
  statements: string;
}

/** Declaration of a uniform contributed by a primitive instance. */
export interface UniformSpec {
  /** Suffix appended to the container's prefix to form the uniform name. */
  nameSuffix: string;
  /** GLSL uniform type. */
  type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool";
  /** Initial value, in the same shape as the type. */
  value: unknown;
  /**
   * Path *inside the GraphNode's `config`* to read the live value at runtime.
   * Defaults to `[nameSuffix]` — appropriate when the uniform's value lives at
   * `node.config[nameSuffix]` (e.g. ColorRamp's `colorA`). Primitives whose
   * uniform value is nested elsewhere in config (e.g. GroupInput pins) override
   * this to point at the actual location.
   */
  valuePath?: readonly string[];
}

/** Static-side metadata declared on each primitive class. */
export interface PrimitiveMeta {
  name: string;
  category?: string;
  color?: string;
  description?: string;
}

/**
 * Static description of a primitive's graph-topology sockets, expressed as
 * Zod object schemas. The `pins` DSL (`float`/`vec2`/…) tags each field with
 * its GLSL pin type and label; `pinSpecsFromSchema()` projects them back to
 * the legacy `PinSpec[]` shape the editor and emitter consume.
 */
export interface PinSchemas {
  readonly in: z.ZodType;
  readonly out: z.ZodType;
}

/**
 * Static contract every primitive class implements. Used by `register()` to
 * instantiate the singleton and read identity for palette UIs.
 */
export interface PrimitiveClass<P extends BasePrimitive = BasePrimitive> {
  new (): P;
  readonly typeId: string;
  readonly meta: PrimitiveMeta;
  readonly config?: z.ZodTypeAny;
  readonly pins: PinSchemas;
}

/**
 * Base class for node-graph primitives.
 *
 * Subclass per typeId; declare identity via static fields (`typeId`, `meta`,
 * `config`, `pins`) and the abstract `emit()` method.
 *
 * The `pins` field is graph-topology metadata expressed as Zod object schemas
 * built with the pin DSL (`float`, `vec2`, …). The schemas are NOT validated
 * at runtime — they're typed-metadata DSL — but their inferred record types
 * flow into the `In`/`Out` generics so `EmitContext` narrows
 * `ctx.inputs.<id>` / `ctx.outputs.<id>` to the actual pin keys.
 *
 * The default `inputs()`/`outputs()` methods project the schemas to
 * `PinSpec[]` via `pinSpecsFromSchema()`. Primitives with config-dependent
 * pin shapes (e.g. group-input) override the methods directly and skip the
 * `static pins` declaration.
 *
 * Generic parameters:
 *   C   — inferred config record (`z.infer<typeof config>`)
 *   In  — inferred input-pin record (`z.infer<typeof pinIn>`)
 *   Out — inferred output-pin record (`z.infer<typeof pinOut>`)
 */
export abstract class BasePrimitive<
  C extends Record<string, unknown> = Record<string, unknown>,
  In extends Record<string, unknown> = Record<string, unknown>,
  Out extends Record<string, unknown> = Record<string, unknown>,
> {
  // === Static identity (set on each subclass) ===
  static readonly typeId: string = "";
  static readonly meta: PrimitiveMeta = { name: "" };
  static readonly config?: z.ZodTypeAny;
  static readonly pins: PinSchemas = { in: z.object({}), out: z.object({}) };

  // Memoized PinSpec[] views of the static pin schemas. Schemas are referentially
  // stable (declared at module load), so we project once per primitive instance.
  private _inSpecs?: readonly PinSpec[];
  private _outSpecs?: readonly PinSpec[];

  /** Instance accessor for the constructing class — used by the inherited getters. */
  get cls(): PrimitiveClass {
    return this.constructor as PrimitiveClass;
  }

  get typeId(): string {
    return this.cls.typeId;
  }
  get name(): string {
    return this.cls.meta.name;
  }
  get category(): string | undefined {
    return this.cls.meta.category;
  }
  get color(): string | undefined {
    return this.cls.meta.color;
  }
  get description(): string | undefined {
    return this.cls.meta.description;
  }
  get config(): z.ZodTypeAny | undefined {
    return this.cls.config;
  }

  inputs(_config: Record<string, unknown>): readonly PinSpec[] {
    return (this._inSpecs ??= pinSpecsFromSchema(this.cls.pins.in));
  }

  outputs(_config: Record<string, unknown>): readonly PinSpec[] {
    return (this._outSpecs ??= pinSpecsFromSchema(this.cls.pins.out));
  }

  /**
   * Op-specific node title. Defaults to the static `meta.name` ("Math",
   * "Vector Math"…); primitives whose identity is determined by an op enum
   * (Math → "Multiply"/"Sine"/…) override this so the title bar names what
   * the node actually does.
   */
  displayTitle(_config: Record<string, unknown>): string {
    return this.name;
  }

  /**
   * Optional 1–3 character glyph rendered prominently in the node body
   * (e.g. `×`, `sin`, `√`). Lets the eye scan a graph by operator without
   * reading text. Returns `undefined` for primitives that don't have a
   * meaningful glyph (most textures, color ramps, etc.).
   */
  glyph(_config: Record<string, unknown>): string | undefined {
    return undefined;
  }

  /** Uniforms this instance contributes. Override when the primitive needs any. */
  uniforms?(node: GraphNode): readonly UniformSpec[];

  /**
   * Canvas-overlay handles this primitive contributes. Each control's address
   * fields (e.g. `key`, `from`, `to`, `center`, `r`) reference keys on
   * `node.config`; the aggregator on `ProceduralField` rewrites them into
   * graph-scoped addresses (`graph:<nodeId>:<key>`) before the overlay reads or
   * writes them.
   */
  spatialControls?(node: GraphNode): readonly SpatialControl[];

  abstract emit(ctx: EmitContext<In, Out>): EmitResult;

  /**
   * Type-narrowing helper. `emit()` overrides call `this.cfg(ctx.config)` to
   * read the per-instance config without a manual `as Config` cast.
   */
  protected cfg(raw: Record<string, unknown>): C {
    return raw as C;
  }
}

/**
 * Public instance shape used by consumers (palette, emitter, composer).
 * Aliasing keeps the existing `NodePrimitive` import surface working — every
 * registered primitive is a `BasePrimitive`.
 */
export type NodePrimitive = BasePrimitive;

const REGISTRY = new Map<string, BasePrimitive>();

/**
 * Register a primitive class. Instantiates the singleton (each primitive has
 * exactly one instance, since static config + dynamic pin overrides describe
 * everything the emitter needs from a per-typeId entry) and stores it under
 * the class's `typeId`.
 *
 * Idempotent — Vite HMR re-imports primitive modules on edit; replacing the
 * previous entry mirrors the live source instead of throwing in dev.
 */
export function register<P extends BasePrimitive>(cls: PrimitiveClass<P>): P {
  const instance = new cls();
  REGISTRY.set(cls.typeId, instance);
  return instance;
}

export function getPrimitive(typeId: string): BasePrimitive | undefined {
  return REGISTRY.get(typeId);
}

export function requirePrimitive(typeId: string): BasePrimitive {
  const p = REGISTRY.get(typeId);
  if (!p) throw new Error(`Unknown node primitive: ${typeId}`);
  return p;
}

export function listPrimitives(): readonly BasePrimitive[] {
  return Array.from(REGISTRY.values());
}

/** Pin-type guard for use during graph validation. */
export function isPinType(s: string): s is PinType {
  return s === "float" || s === "vec2" || s === "vec3" || s === "vec4" || s === "bool" || s === "int";
}
