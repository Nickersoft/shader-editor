// Shared helpers for graph-backed shaders.
//
// Both `ProceduralShader` (generator) and `ProceduralEffect` (effect) own a
// `NodeGraph` whose topology drives `glsl()` + uniform emission. The two
// classes share the same emit/structural-key/clone logic; this module hosts
// the free functions so neither branch needs to call into the other.

import type { ExtraUniformDecl } from "@/lib/codegen/types";
import {
  emitGraph,
  requireNode,
  type Edge as GraphEdge,
  type EmittedGraph,
  type GraphNode,
  type NodeGraph,
} from "@/shaders/node-graph";

/**
 * Deep-clone a graph (nodes, edges, frames). Mirrors the per-class clone
 * helpers that previously lived in `ProceduralShader` and `ProceduralEffect`.
 */
export function cloneGraph(g: NodeGraph): NodeGraph {
  return {
    nodes: g.nodes.map(cloneNode),
    edges: g.edges.map((e) => ({ ...e })),
    ...(g.frames
      ? {
          frames: g.frames.map((f) => ({
            ...f,
            position: { ...f.position },
            size: { ...f.size },
            ...(f.nodeIds ? { nodeIds: [...f.nodeIds] } : {}),
          })),
        }
      : {}),
  };
}

function cloneNode(n: GraphNode): GraphNode {
  return {
    id: n.id,
    typeId: n.typeId,
    config: structuredClone(n.config),
    position: { ...n.position },
    ...(n.pinValues ? { pinValues: structuredClone(n.pinValues) } : {}),
  };
}

/**
 * Structural fingerprint of a graph — every per-primitive field except live
 * uniform-value paths, plus the edge set. Identical fingerprint ⇒ identical
 * emitted GLSL (so the cached `EmittedGraph` is safe to reuse).
 */
export function graphStructuralKey(graph: NodeGraph): string {
  const parts: string[] = [];
  for (const node of graph.nodes) {
    const prim = safeRequire(node.typeId);
    const livePaths = prim ? prim.uniforms(node).map((u) => u.valuePath ?? [u.nameSuffix]) : [];
    const structural = excludePaths(node.config, livePaths);
    const pinKey = node.pinValues ? JSON.stringify(node.pinValues) : "";
    parts.push(`${node.id}:${node.typeId}:${JSON.stringify(structural)}:${pinKey}`);
  }
  parts.sort();
  const edgePart = graph.edges
    .map((e: GraphEdge) => `${e.fromNodeId}.${e.fromPin}->${e.toNodeId}.${e.toPin}`)
    .sort()
    .join(",");
  return `${parts.join("|")}#${edgePart}`;
}

/**
 * Per-instance emit cache. Both procedural classes hold one of these so
 * `extraUniforms()` and `glsl()` share one emit pass per rebuild key.
 */
export class GraphEmitCache {
  private key?: string;
  private emitted?: EmittedGraph;

  get(graph: NodeGraph, prefix: string): EmittedGraph {
    const key = graphStructuralKey(graph);
    if (this.key === key && this.emitted) return this.emitted;
    const emitted = emitGraph(graph, { containerPrefix: prefix });
    this.key = key;
    this.emitted = emitted;
    return emitted;
  }

  /** Drop the cache (e.g. after the host instance mutates the graph in place). */
  invalidate(): void {
    this.key = undefined;
    this.emitted = undefined;
  }
}

/** Convenience: typed accessor for the graph-emitted extra uniforms. */
export function emittedExtras(emitted: EmittedGraph): ExtraUniformDecl[] {
  return emitted.uniforms;
}

// === Internal helpers ===

function safeRequire(typeId: string): ReturnType<typeof requireNode> | null {
  try {
    return requireNode(typeId);
  } catch {
    return null;
  }
}

function excludePaths(value: unknown, paths: readonly (readonly string[])[]): unknown {
  if (paths.length === 0) return value;
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      const sub = pathsForKey(paths, String(i));
      return excludePaths(item, sub);
    });
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const sub = pathsForKey(paths, key);
      if (sub.some((p) => p.length === 0)) continue;
      out[key] = excludePaths((value as Record<string, unknown>)[key], sub);
    }
    return out;
  }
  return value;
}

function pathsForKey(
  paths: readonly (readonly string[])[],
  key: string,
): readonly (readonly string[])[] {
  const out: (readonly string[])[] = [];
  for (const p of paths) {
    if (p[0] === key) out.push(p.slice(1));
  }
  return out;
}
