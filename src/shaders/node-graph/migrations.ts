// Typeid migrations. Loaded by both `ProceduralField` and `GraphEffectBase`
// during graph rehydration so saved scenes survive primitive renames and
// retirements.
//
// Two flavours:
//   - Plain renames: just remap the typeId string.
//   - Structural migrations: rewrite the node and its incident edges (pin
//     renames, config injection). Used when retiring a primitive whose role
//     can be expressed by a more general one (e.g. `bool-to-float` becomes a
//     `reroute`).
//
// All migrations are idempotent — running them on an already-migrated graph
// returns the same shape.

import type { Edge, GraphNode, NodeGraph } from "./types";

const TYPEID_RENAMES: Record<string, string> = {
  "combine-rgb": "combine-color",
  "separate-rgb": "separate-color",
};

interface StructuralMigration {
  /** Return the new typeId. */
  typeId: string;
  /** Optional config rewriter — receives the legacy config, returns the new one. */
  rewriteConfig?: (cfg: Record<string, unknown>) => Record<string, unknown>;
  /** Input-pin id renames (legacy → current). Applied to every edge whose toNodeId is this node. */
  renameInputs?: Record<string, string>;
  /** Output-pin id renames. Applied to every edge whose fromNodeId is this node. */
  renameOutputs?: Record<string, string>;
}

const STRUCTURAL: Record<string, StructuralMigration> = {
  // `bool-to-float` retires in favour of implicit bool→float coercion. The
  // safe migration is a typeless reroute: it preserves both edges, the
  // upstream produces a bool, and coercion at the downstream consumer
  // performs the conversion. The reroute's pinType is set to `bool` so the
  // pass-through types correctly.
  "bool-to-float": {
    typeId: "reroute",
    rewriteConfig: () => ({ pinType: "bool" }),
    renameInputs: { x: "in" },
    // `out` stays `out` — no rename needed.
  },
};

/**
 * In-place config rewrites for typeIds that didn't change. Keyed by typeId.
 * Used when an op enum gains kebab-case spellings (e.g. `rotate2D` →
 * `rotate-2d`).
 */
const CONFIG_REWRITES: Record<string, (cfg: Record<string, unknown>) => Record<string, unknown>> = {
  "vector-math": (cfg) => {
    if ((cfg as { op?: string }).op === "rotate2D") {
      return { ...cfg, op: "rotate-2d" };
    }
    return cfg;
  },
};

/** Map a legacy typeId to its current form. Returns the input unchanged when no migration is registered. */
export function migrateTypeId(typeId: string): string {
  if (typeId in STRUCTURAL) return STRUCTURAL[typeId].typeId;
  return TYPEID_RENAMES[typeId] ?? typeId;
}

/** Apply all migrations to a graph in place. Idempotent. */
export function migrateGraph(graph: NodeGraph): NodeGraph {
  for (const node of graph.nodes) {
    const legacyId = node.typeId;
    const structural = STRUCTURAL[legacyId];
    if (structural) {
      node.typeId = structural.typeId;
      if (structural.rewriteConfig) {
        node.config = structural.rewriteConfig(node.config ?? {});
      }
      if (structural.renameInputs) {
        for (const e of graph.edges) {
          if (e.toNodeId === node.id) {
            const next = structural.renameInputs[e.toPin];
            if (next) e.toPin = next;
          }
        }
      }
      if (structural.renameOutputs) {
        for (const e of graph.edges) {
          if (e.fromNodeId === node.id) {
            const next = structural.renameOutputs[e.fromPin];
            if (next) e.fromPin = next;
          }
        }
      }
      continue;
    }
    const renamed = TYPEID_RENAMES[legacyId];
    if (renamed) node.typeId = renamed;
    // Apply any same-typeId config rewrite (runs after rename so the table
    // is keyed by the current typeId).
    const rewriter = CONFIG_REWRITES[node.typeId];
    if (rewriter) node.config = rewriter(node.config ?? {});
  }
  return graph;
}

/** Same as `migrateGraph` but operating on a single node (does NOT touch edges). */
export function migrateNode(node: GraphNode): GraphNode {
  const next = migrateTypeId(node.typeId);
  if (next !== node.typeId) node.typeId = next;
  return node;
}

/**
 * Migrate during clone: used by graph hosts that walk nodes one at a time.
 * Returns the new typeId without mutating; callers should also run
 * `migrateGraph` on the edges if structural migrations are in play.
 */
export function migrateNodeStructural(
  node: GraphNode,
  edges: Edge[],
): { typeId: string; config: Record<string, unknown> } {
  const structural = STRUCTURAL[node.typeId];
  if (!structural) {
    return { typeId: migrateTypeId(node.typeId), config: node.config };
  }
  if (structural.renameInputs) {
    for (const e of edges) {
      if (e.toNodeId === node.id) {
        const next = structural.renameInputs[e.toPin];
        if (next) e.toPin = next;
      }
    }
  }
  if (structural.renameOutputs) {
    for (const e of edges) {
      if (e.fromNodeId === node.id) {
        const next = structural.renameOutputs[e.fromPin];
        if (next) e.fromPin = next;
      }
    }
  }
  return {
    typeId: structural.typeId,
    config: structural.rewriteConfig
      ? structural.rewriteConfig(node.config ?? {})
      : node.config,
  };
}
