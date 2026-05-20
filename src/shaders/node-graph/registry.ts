// Node registry. Each node is an instance of a `BaseNode`
// subclass that declares its pin shape, optional per-instance config schema,
// GLSL emit method, and palette metadata.
//
// Nodes are registered at module load via `register(MyNode)` from
// their own files under nodes/. The node-graph emit loop looks each one
// up by typeId.

import { z } from "zod";
import type { GlslHelperName } from "@/shaders/core/types";
import type { SpatialControl } from "@/shaders/core/spatial";
import { pinSpecsFromSchema } from "./pins";
import type { GraphNode, PinSpec } from "./types";

/**
 * Per-emit context handed to `emit()`. The three id-set generics narrow the
 * `inputs` / `outputs` / `uniforms` records so nodes get typed access to
 * their own pin keys (`ctx.inputs.x` typo-checks). Each generic is a record
 * shape — `BaseNode<C, In, Out>` derives them from the node's Zod
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
  /** Uniform names for parameters declared by this node (e.g. ColorRamp colors). */
  uniforms: { readonly [K in keyof U]: string };
  /** Per-instance config (validated against the node's config schema). */
  config: Record<string, unknown>;
  /** Register a GLSL helper dependency to be included in the fragment shader. */
  addDependency: (name: GlslHelperName) => void;
}

export interface EmitResult {
  /** GLSL statements that declare each output local. Concatenated by the emitter. */
  statements: string;
}

/** GLSL uniform type — also the legal value set of `static uniformKeys`. */
export type UniformType = "float" | "vec2" | "vec3" | "vec4" | "int" | "bool";

/** Declaration of a uniform contributed by a node instance. */
export interface UniformSpec {
  /** Suffix appended to the container's prefix to form the uniform name. */
  nameSuffix: string;
  /** GLSL uniform type. */
  type: UniformType;
  /** Initial value, in the same shape as the type. */
  value: unknown;
  /**
   * Path *inside the GraphNode's `config`* to read the live value at runtime.
   * Defaults to `[nameSuffix]` — appropriate when the uniform's value lives at
   * `node.config[nameSuffix]` (e.g. ColorRamp's `colorA`). Nodes whose
   * uniform value is nested elsewhere in config (e.g. GroupInput pins) override
   * this to point at the actual location.
   */
  valuePath?: readonly string[];
}

/** Static-side metadata declared on each node class. */
export interface NodeMeta {
  name: string;
  category?: string;
  color?: string;
  description?: string;
}

/**
 * Static description of a node's graph-topology sockets, expressed as
 * Zod object schemas. The `pins` DSL (`float`/`vec2`/…) tags each field with
 * its GLSL pin type and label; `pinSpecsFromSchema()` projects them back to
 * the legacy `PinSpec[]` shape the editor and emitter consume.
 */
export interface PinSchemas {
  readonly in: z.ZodType;
  readonly out: z.ZodType;
}

/**
 * Static contract every node class implements. Used by `register()` to
 * instantiate the singleton and read identity for palette UIs.
 */
export interface NodeClass<P extends BaseNode = BaseNode> {
  new (): P;
  readonly typeId: string;
  readonly meta: NodeMeta;
  readonly config?: z.ZodTypeAny;
  readonly pins: PinSchemas;
  /**
   * Map of `config` key → GLSL uniform type. The default `uniforms()`
   * implementation reads this table and produces one UniformSpec per entry,
   * with `nameSuffix === key` and `value === node.config[key]`. Nodes
   * with dynamic uniform sets (e.g. ColorRamp, per-stop colors) or
   * non-default `valuePath` (e.g. GroupInput pins) override `uniforms()`
   * directly instead.
   */
  readonly uniformKeys?: Readonly<Record<string, UniformType>>;
}

/**
 * Base class for node-graph nodes.
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
 * `PinSpec[]` via `pinSpecsFromSchema()`. Nodes with config-dependent
 * pin shapes (e.g. group-input) override the methods directly and skip the
 * `static pins` declaration.
 *
 * Generic parameters:
 *   C   — inferred config record (`z.infer<typeof config>`)
 *   In  — inferred input-pin record (`z.infer<typeof pinIn>`)
 *   Out — inferred output-pin record (`z.infer<typeof pinOut>`)
 */
export abstract class BaseNode<
  C extends Record<string, unknown> = Record<string, unknown>,
  In extends Record<string, unknown> = Record<string, unknown>,
  Out extends Record<string, unknown> = Record<string, unknown>,
> {
  // === Static identity (set on each subclass) ===
  static readonly typeId: string = "";
  static readonly meta: NodeMeta = { name: "" };
  static readonly config?: z.ZodTypeAny;
  static readonly pins: PinSchemas = { in: z.object({}), out: z.object({}) };
  static readonly uniformKeys?: Readonly<Record<string, UniformType>>;

  // Memoized PinSpec[] views of the static pin schemas. Schemas are referentially
  // stable (declared at module load), so we project once per node instance.
  private _inSpecs?: readonly PinSpec[];
  private _outSpecs?: readonly PinSpec[];

  /**
   * Configured-node descriptor: when present, this instance was constructed
   * with config via `new MyPrim({...})` for use as a `GraphBuilder.add()`
   * argument, rather than as the registry singleton. The builder reads this
   * and discards the instance; dispatch still goes through the singleton.
   *
   * Stored as `Partial<C>` because the Zod config schema is parsed at
   * `addAt()` time, which fills in defaults. Authors only need to specify
   * the fields they want to override. (Strictly, `z.input<typeof config>`
   * would be more precise — it knows which fields have `.default()` and
   * which are truly required — but plumbing the input type through the
   * generic is more friction than the gained precision warrants.)
   */
  readonly descriptorConfig?: Partial<C>;

  constructor(config?: Partial<C>) {
    if (config !== undefined) this.descriptorConfig = config;
  }

  /** Instance accessor for the constructing class — used by the inherited getters. */
  get cls(): NodeClass {
    return this.constructor as NodeClass;
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
   * "Vector Math"…); nodes whose identity is determined by an op enum
   * (Math → "Multiply"/"Sine"/…) override this so the title bar names what
   * the node actually does.
   */
  displayTitle(_config: Record<string, unknown>): string {
    return this.name;
  }

  /**
   * Optional 1–3 character glyph rendered prominently in the node body
   * (e.g. `×`, `sin`, `√`). Lets the eye scan a graph by operator without
   * reading text. Returns `undefined` for nodes that don't have a
   * meaningful glyph (most textures, color ramps, etc.).
   */
  glyph(_config: Record<string, unknown>): string | undefined {
    return undefined;
  }

  /**
   * Uniforms this instance contributes. The default reads `static uniformKeys`
   * — sufficient for the common case where every uniform's value lives at
   * `node.config[key]`. Nodes with dynamic sets or nested `valuePath`s
   * override this method directly.
   */
  uniforms(node: GraphNode): readonly UniformSpec[] {
    const keys = this.cls.uniformKeys;
    if (!keys) return [];
    const cfg = node.config as Record<string, unknown>;
    const specs: UniformSpec[] = [];
    for (const key in keys) {
      specs.push({ nameSuffix: key, type: keys[key], value: cfg[key] });
    }
    return specs;
  }

  /**
   * Canvas-overlay handles this node contributes. Each control's address
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

const REGISTRY = new Map<string, BaseNode>();

/**
 * Register a node class. Instantiates the singleton (each node has
 * exactly one instance, since static config + dynamic pin overrides describe
 * everything the emitter needs from a per-typeId entry) and stores it under
 * the class's `typeId`.
 *
 * Idempotent — Vite HMR re-imports node modules on edit; replacing the
 * previous entry mirrors the live source instead of throwing in dev.
 */
export function register<P extends BaseNode>(cls: NodeClass<P>): P {
  const instance = new cls();
  REGISTRY.set(cls.typeId, instance);
  return instance;
}

export function getNode(typeId: string): BaseNode | undefined {
  return REGISTRY.get(typeId);
}

export function requireNode(typeId: string): BaseNode {
  const p = REGISTRY.get(typeId);
  if (!p) throw new Error(`Unknown node: ${typeId}`);
  return p;
}

export function listNodes(): readonly BaseNode[] {
  return Array.from(REGISTRY.values());
}
