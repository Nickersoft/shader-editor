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

import type { NodeGraph } from "./types";

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
  // The four legacy fixed-shape gradient-domain primitives collapse into one
  // `gradient-domain` with a `mode` config. Each migration injects the
  // appropriate mode and preserves the existing config keys.
  "linear-gradient-domain": {
    typeId: "gradient-domain",
    rewriteConfig: (c) => ({ ...c, mode: "linear" }),
  },
  "radial-gradient-domain": {
    typeId: "gradient-domain",
    rewriteConfig: (c) => ({ ...c, mode: "radial" }),
  },
  "conic-gradient-domain": {
    typeId: "gradient-domain",
    rewriteConfig: (c) => ({ ...c, mode: "conic" }),
  },
  "diamond-gradient-domain": {
    typeId: "gradient-domain",
    rewriteConfig: (c) => ({ ...c, mode: "diamond" }),
  },
  // The four single-shape lattice masks collapse into `lattice-mask` with a
  // `mode` config. `cell-grid` stays separate — it returns cell UV + id
  // rather than a binary mask, so it serves a different role.
  "checker-texture": {
    typeId: "lattice-mask",
    rewriteConfig: (c) => ({ ...c, mode: "checker" }),
  },
  "dot-grid": {
    typeId: "lattice-mask",
    rewriteConfig: (c) => ({ ...c, mode: "dots" }),
  },
  "grid-lines": {
    typeId: "lattice-mask",
    rewriteConfig: (c) => ({ ...c, mode: "lines" }),
  },
  "hex-grid": {
    typeId: "lattice-mask",
    rewriteConfig: (c) => ({ ...c, mode: "hex" }),
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
