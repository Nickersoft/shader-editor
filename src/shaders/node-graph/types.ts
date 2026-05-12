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
}

export type PinDefault =
  | number
  | boolean
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

/**
 * One node placed on the canvas. `typeId` resolves to a NodePrimitive in the
 * registry. `config` is the per-instance state shaped by the primitive's
 * config schema. `position` is the xyflow canvas position.
 */
export interface GraphNode {
  id: string;
  typeId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface Edge {
  fromNodeId: string;
  fromPin: string;
  toNodeId: string;
  toPin: string;
}

export interface NodeGraph {
  nodes: GraphNode[];
  edges: Edge[];
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

function floatLit(n: number): string {
  if (!Number.isFinite(n)) return "0.0";
  const s = String(n);
  return s.includes(".") || s.includes("e") || s.includes("E") ? s : `${s}.0`;
}
