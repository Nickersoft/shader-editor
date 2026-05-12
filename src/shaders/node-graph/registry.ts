// Primitive registry. Each NodePrimitive declares its pin shape, optional
// per-instance config schema, GLSL emit function, and palette metadata.
//
// Primitives are registered at module load via `registerPrimitive(spec)` from
// their own files under primitives/. The node-graph emit loop looks each one
// up by typeId.

import type { z } from "zod";
import type { GlslHelperName } from "@/shaders/core/types";
import type { GraphNode, PinSpec, PinType } from "./types";

export interface EmitContext {
  /** GLSL expressions for each input pin, already resolved (default literal if unwired). */
  inputs: Record<string, string>;
  /** Unique local-variable name for each output pin. Emit must assign these. */
  outputs: Record<string, string>;
  /** Uniform names for parameters declared by this primitive (e.g. ColorRamp colors). */
  uniforms: Record<string, string>;
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
}

/**
 * The contract every primitive implements. Input/output pin lists can be
 * static or a function of the instance config (e.g. GroupInput's outputs are
 * declared dynamically by its config.pins).
 */
export interface NodePrimitive {
  readonly typeId: string;
  readonly name: string;
  readonly category?: string;
  readonly color?: string;
  readonly description?: string;
  /** Per-instance config schema. Defaults to an empty object if omitted. */
  readonly config?: z.ZodTypeAny;

  inputs(config: Record<string, unknown>): readonly PinSpec[];
  outputs(config: Record<string, unknown>): readonly PinSpec[];
  /** Uniforms this instance contributes. Omit if it has none. */
  uniforms?(node: GraphNode): readonly UniformSpec[];

  emit(ctx: EmitContext): EmitResult;
}

const REGISTRY = new Map<string, NodePrimitive>();

export function registerPrimitive(spec: NodePrimitive): NodePrimitive {
  if (REGISTRY.has(spec.typeId)) {
    throw new Error(`Duplicate node primitive registration: ${spec.typeId}`);
  }
  REGISTRY.set(spec.typeId, spec);
  return spec;
}

export function getPrimitive(typeId: string): NodePrimitive | undefined {
  return REGISTRY.get(typeId);
}

export function requirePrimitive(typeId: string): NodePrimitive {
  const p = REGISTRY.get(typeId);
  if (!p) throw new Error(`Unknown node primitive: ${typeId}`);
  return p;
}

export function listPrimitives(): readonly NodePrimitive[] {
  return Array.from(REGISTRY.values());
}

/** Pin-type guard for use during graph validation. */
export function isPinType(s: string): s is PinType {
  return s === "float" || s === "vec2" || s === "vec3" || s === "vec4" || s === "bool" || s === "int";
}
