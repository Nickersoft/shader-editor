// Node graph types for ProceduralField's DAG-of-primitives model.
//
// A NodeGraph is a directed acyclic graph of GraphNode instances connected by
// Edges between typed Pins. The graph terminates in a single GroupOutput node;
// a single GroupInput node declares the layer's user-facing parameter pins,
// which surface in the property panel.
//
// GLSL emission topologically sorts the graph and emits one named local per
// output pin. No shared scope, no implicit `vec2 p / float n` chain.

export type PinType = "float" | "vec2" | "vec3" | "vec4" | "bool" | "int";

export const PIN_TYPES = ["float", "vec2", "vec3", "vec4", "bool", "int"] as const;

/**
 * Static description of one input or output pin on a primitive. Output pin
 * defaults are unused; input pin defaults serve as the GLSL literal for
 * unwired inputs.
 */
export interface PinSpec {
  id: string;
  type: PinType;
  label?: string;
  // For input pins only. Encoded as a JS value matching the pin's PinType:
  //   float/int → number
  //   vec2 → [number, number]
  //   vec3 → [number, number, number]
  //   vec4 → [number, number, number, number]
  //   bool → boolean
  default?: PinDefault;
  // Semantic tag layered atop the GLSL type. Drives two things:
  //   1. UI rendering — `color` swaps the inline scrubbers for a swatch.
  //   2. Implicit coercion — when a vec3 collapses to a float, `color`
  //      yields Rec.709 luminance, `vector` yields length(), `uv` rejects.
  // Emit otherwise ignores subtype.
  subtype?: "color" | "vector" | "uv" | "angle" | "channel";
}

export type PinDefault =
  | number
  | boolean
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

/**
 * One node placed on the canvas. `typeId` resolves to a BaseNode in the
 * registry. `config` is the per-instance state shaped by the primitive's
 * config schema. `position` is the xyflow canvas position.
 */
export interface GraphNode {
  id: string;
  typeId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  /**
   * Per-pin override values for unwired input pins (Blender-style inline
   * defaults). Falls back to the primitive's PinSpec.default when absent.
   * Ignored entirely for any pin that has an incoming edge.
   */
  pinValues?: Record<string, PinDefault>;
}

export interface Edge {
  fromNodeId: string;
  fromPin: string;
  toNodeId: string;
  toPin: string;
}

/**
 * A non-emit visual grouping: a colored, labelled rectangle that sits behind
 * nodes to organise a sub-area of the graph (e.g. "Domain warp", "Color
 * grading"). Frames are pure metadata — emit() ignores them entirely.
 */
export interface Frame {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  /** CSS color string used for the title chip and tinted background. */
  color: string;
  /**
   * Explicit member node IDs. Set by preset builders so layoutGraph can lay
   * the cluster out as a single super-node; user-drawn frames leave this
   * undefined and rely on spatial-bbox membership at drag time.
   */
  nodeIds?: string[];
}

export interface NodeGraph {
  nodes: GraphNode[];
  edges: Edge[];
  /**
   * Optional visual frames grouping subsets of nodes. Absent on legacy graphs;
   * treat `undefined` as `[]`.
   */
  frames?: Frame[];
}

/**
 * Helper: GLSL type name for a PinType. The mapping is the identity for
 * everything but `bool`/`int`, which already match GLSL. Kept as a function
 * so future-us has a single place to layer in any aliasing (e.g. `color` for
 * vec3 if we ever introduce it).
 */
export function glslTypeOf(pin: PinType): string {
  return pin;
}

/**
 * Encode a JS default value as a GLSL literal of the given pin type. Used
 * when an input pin has no incoming edge and we substitute its default.
 */
export function glslLiteral(type: PinType, value: PinDefault | undefined): string {
  switch (type) {
    case "float":
      return floatLit(typeof value === "number" ? value : 0);
    case "int":
      return String(Math.trunc(typeof value === "number" ? value : 0));
    case "bool":
      return value ? "true" : "false";
    case "vec2": {
      const v = Array.isArray(value) ? value : [0, 0];
      return `vec2(${floatLit(v[0] ?? 0)}, ${floatLit(v[1] ?? 0)})`;
    }
    case "vec3": {
      const v = Array.isArray(value) ? value : [0, 0, 0];
      return `vec3(${floatLit(v[0] ?? 0)}, ${floatLit(v[1] ?? 0)}, ${floatLit(v[2] ?? 0)})`;
    }
    case "vec4": {
      const v = Array.isArray(value) ? value : [0, 0, 0, 1];
      return `vec4(${floatLit(v[0] ?? 0)}, ${floatLit(v[1] ?? 0)}, ${floatLit(v[2] ?? 0)}, ${floatLit(v[3] ?? 1)})`;
    }
  }
}

/**
 * Format a JS number as a GLSL float literal. Adds a `.0` suffix if needed so
 * the constant parses as `float` rather than `int` in GLSL.
 */
export function floatLit(n: number): string {
  if (!Number.isFinite(n)) return "0.0";
  const s = String(n);
  return s.includes(".") || s.includes("e") || s.includes("E") ? s : `${s}.0`;
}

/**
 * JS-side zero/default value for a pin type. Mirrors the shape `glslLiteral`
 * would produce when given `undefined`. Used by the editor's inline pin
 * editors and by GroupInput uniform binding so a missing override produces
 * the same value the GLSL would.
 */
export function defaultForPinType(type: PinType): PinDefault {
  switch (type) {
    case "float":
    case "int":
      return 0;
    case "bool":
      return false;
    case "vec2":
      return [0, 0];
    case "vec3":
      return [0, 0, 0];
    case "vec4":
      return [0, 0, 0, 1];
  }
}

/**
 * Coerce an arbitrary value to the canonical JS shape for a pin type. Used at
 * graph hydration / GroupInput-uniform-binding time when the raw value may
 * have come from JSON and is structurally unknown.
 */
export function coerceToPinDefault(type: "float", raw: unknown): number;
export function coerceToPinDefault(type: "int", raw: unknown): number;
export function coerceToPinDefault(type: "bool", raw: unknown): boolean;
export function coerceToPinDefault(type: "vec2", raw: unknown): [number, number];
export function coerceToPinDefault(type: "vec3", raw: unknown): [number, number, number];
export function coerceToPinDefault(
  type: "vec4",
  raw: unknown,
): [number, number, number, number];
export function coerceToPinDefault(type: PinType, raw: unknown): PinDefault;
export function coerceToPinDefault(type: PinType, raw: unknown): PinDefault {
  switch (type) {
    case "float":
      return typeof raw === "number" ? raw : 0;
    case "int":
      return typeof raw === "number" ? Math.trunc(raw) : 0;
    case "bool":
      return raw === true;
    case "vec2":
      return Array.isArray(raw) && raw.length >= 2
        ? [Number(raw[0]) || 0, Number(raw[1]) || 0]
        : [0, 0];
    case "vec3":
      return Array.isArray(raw) && raw.length >= 3
        ? [Number(raw[0]) || 0, Number(raw[1]) || 0, Number(raw[2]) || 0]
        : [0, 0, 0];
    case "vec4":
      return Array.isArray(raw) && raw.length >= 4
        ? [Number(raw[0]) || 0, Number(raw[1]) || 0, Number(raw[2]) || 0, Number(raw[3]) || 1]
        : [0, 0, 0, 1];
  }
}
