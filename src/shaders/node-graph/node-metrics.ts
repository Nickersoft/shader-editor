// Pixel dimensions shared between the texture-graph renderer and the layout
// algorithm. Keep these in sync — drift between renderer geometry and layout
// height estimates is what causes overlapping or oddly-spaced nodes after a
// Tidy pass.

import { inspectFields } from "@/lib/codegen/schema-introspection";

import { getNode } from "./registry";
import type { Edge, GraphNode } from "./types";

export const NODE_W = 220;
export const HEADER_H = 34;
// Standard pin row — used for outputs and for wired inputs.
export const PIN_ROW_H = 24;
// Taller row for unwired inputs that host an inline editor
// (NumberInput / VecScrubber / ColorSwatch).
export const INLINE_PIN_ROW_H = 32;
// Inline config row (float / int / bool / enumString fields that fit on a
// 220-wide node). Complex fields stay in the property panel.
export const CONFIG_ROW_H = 32;
export const NODE_BOTTOM_PADDING = 8;

export const INLINE_CONFIG_TYPES: ReadonlySet<string> = new Set([
  "float",
  "int",
  "bool",
  "enumString",
]);

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Compute the rendered height of a primitive node. Pass `wiredInputIds` to
 * correctly account for unwired inputs, which render taller because they host
 * an inline editor. Omit for a worst-case overestimate (all inputs unwired).
 */
export function nodeHeight(node: GraphNode, wiredInputIds: ReadonlySet<string> = EMPTY_SET): number {
  const prim = getNode(node.typeId);
  if (!prim) return HEADER_H + PIN_ROW_H * 2;
  const inputs = prim.inputs(node.config);
  const outputs = prim.outputs(node.config);
  const configCount = prim.config
    ? inspectFields(prim.config).filter((f) => INLINE_CONFIG_TYPES.has(f.glslType)).length
    : 0;
  let inputRows = 0;
  for (const pin of inputs) {
    inputRows += wiredInputIds.has(pin.id) ? PIN_ROW_H : INLINE_PIN_ROW_H;
  }
  return (
    HEADER_H +
    outputs.length * PIN_ROW_H +
    configCount * CONFIG_ROW_H +
    inputRows +
    NODE_BOTTOM_PADDING
  );
}

/**
 * Build a `nodeId → Set<wired input pin id>` map from an edge list, so
 * `nodeHeight` can be evaluated correctly for every node in one pass.
 */
export function wiredInputsByNode(edges: readonly Edge[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const e of edges) {
    let set = m.get(e.toNodeId);
    if (!set) m.set(e.toNodeId, (set = new Set()));
    set.add(e.toPin);
  }
  return m;
}
