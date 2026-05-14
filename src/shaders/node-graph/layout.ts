// Layered auto-layout for node graphs. Used by the preset builder so authored
// presets land with a readable left-to-right column layout, and by the
// "Tidy" button in the editor so users can re-layout their own graphs.
//
// Algorithm: longest-path layering on the dependency DAG (column = longest
// path from any source node), then a 2-sweep barycentric crossing-reduction
// pass to order nodes vertically within each column. Node heights are
// estimated from the primitive's pin + inline-config counts so stacked
// columns don't overlap.
//
// Frames with explicit `nodeIds` are treated as cluster super-nodes: their
// members lay out as a sub-graph, the cluster is sized by that sub-layout's
// bbox plus padding, and the outer column algorithm packs the cluster as a
// single rectangle. Frames without `nodeIds` (user-drawn) are pure spatial
// boxes and are left alone here.

import { inspectUiFields } from "@/lib/codegen/schema-introspection";
import type { Edge, Frame, GraphNode, NodeGraph } from "./types";
import { getPrimitive } from "./registry";

const HEADER_H = 34;
const PIN_ROW_H = 24;
const CONFIG_ROW_H = 32;
const NODE_BOTTOM_PADDING = 8;

const COL_GAP_X = 80;
const ROW_GAP_Y = 24;
const NODE_W = 220;

// Padding & header allowance applied around each cluster's sub-layout bbox.
const FRAME_PADDING = 24;
const FRAME_HEADER = 32;
// Inter-cluster gap inside a column — a hair more breathing room than
// ROW_GAP_Y so the colored backplates don't visually fuse.
const FRAME_GAP_Y = 36;

const INLINE_TYPES = new Set(["float", "int", "bool", "enumString"]);

function estimateNodeHeight(node: GraphNode): number {
  const prim = getPrimitive(node.typeId);
  if (!prim) return HEADER_H + PIN_ROW_H * 2;
  const inputCount = prim.inputs(node.config).length;
  const outputCount = prim.outputs(node.config).length;
  // Reuse the same inline-config filter the node template applies, so the
  // estimated height matches what's actually rendered.
  const configCount = prim.config
    ? inspectUiFields(prim.config).filter((f) => INLINE_TYPES.has(f.glslType)).length
    : 0;
  return (
    HEADER_H +
    outputCount * PIN_ROW_H +
    configCount * CONFIG_ROW_H +
    inputCount * PIN_ROW_H +
    NODE_BOTTOM_PADDING
  );
}

/**
 * Compute new positions for every node and frame in the graph. Returns a
 * fresh NodeGraph; the input is not mutated. Frames with `nodeIds` are
 * treated as clusters; frames without are passed through unchanged.
 *
 * The non-cluster path (no frames, or only spatial frames) is the original
 * column algorithm and produces the same output as before this refactor.
 */
export function layoutGraph(graph: NodeGraph): NodeGraph {
  const allFrames = graph.frames ?? [];
  const clusterFrames = allFrames.filter((f) => f.nodeIds && f.nodeIds.length > 0);
  const passiveFrames = allFrames.filter((f) => !f.nodeIds || f.nodeIds.length === 0);

  if (clusterFrames.length === 0) {
    const flat = layoutFlat(graph.nodes, graph.edges);
    return {
      nodes: flat,
      edges: graph.edges.map((e) => ({ ...e })),
      ...(passiveFrames.length > 0
        ? { frames: passiveFrames.map((f) => ({ ...f })) }
        : {}),
    };
  }

  return layoutWithClusters(graph.nodes, graph.edges, clusterFrames, passiveFrames);
}

/** Apply `layoutGraph` to the given graph and return a fresh NodeGraph. */
export function relayoutGraph(graph: NodeGraph): NodeGraph {
  return layoutGraph(graph);
}

// ============================================================================
// Cluster-aware layout

interface SuperNode {
  id: string;
  // Footprint width and height — what the column packer reasons about.
  w: number;
  h: number;
  kind: "node" | "cluster";
  // For cluster super-nodes: the member sub-positions (relative to (0,0))
  // and the originating frame definition.
  memberOffsets?: Map<string, { x: number; y: number }>;
  frame?: Frame;
  node?: GraphNode;
}

function layoutWithClusters(
  nodes: GraphNode[],
  edges: Edge[],
  clusterFrames: Frame[],
  passiveFrames: Frame[],
): NodeGraph {
  // ── ownership ────────────────────────────────────────────────────────────
  // Each node belongs to at most one cluster. If two frames claim the same
  // node, the first wins — preset authors shouldn't double-claim, but a
  // deterministic tie-break keeps the output sane if they do.
  const clusterOf = new Map<string, string>();
  for (const f of clusterFrames) {
    for (const nid of f.nodeIds!) {
      if (!clusterOf.has(nid)) clusterOf.set(nid, f.id);
    }
  }

  // ── build super-nodes ────────────────────────────────────────────────────
  const supers: SuperNode[] = [];
  const superIdOfNode = new Map<string, string>();

  for (const f of clusterFrames) {
    const memberNodes = nodes.filter((n) => clusterOf.get(n.id) === f.id);
    if (memberNodes.length === 0) continue;
    const memberSet = new Set(memberNodes.map((n) => n.id));
    const intraEdges = edges.filter(
      (e) => memberSet.has(e.fromNodeId) && memberSet.has(e.toNodeId),
    );
    // Lay the cluster's contents out as their own little graph.
    const subLaid = layoutFlat(memberNodes, intraEdges);
    // Normalize sub-positions to (0, 0) origin and compute footprint.
    const heights = new Map(subLaid.map((n) => [n.id, estimateNodeHeight(n)] as const));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of subLaid) {
      const h = heights.get(n.id)!;
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      const right = n.position.x + NODE_W;
      const bottom = n.position.y + h;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
    const memberOffsets = new Map<string, { x: number; y: number }>();
    for (const n of subLaid) {
      memberOffsets.set(n.id, {
        x: n.position.x - minX + FRAME_PADDING,
        y: n.position.y - minY + FRAME_PADDING + FRAME_HEADER,
      });
    }
    const superId = `cluster:${f.id}`;
    supers.push({
      id: superId,
      kind: "cluster",
      w: maxX - minX + FRAME_PADDING * 2,
      h: maxY - minY + FRAME_PADDING * 2 + FRAME_HEADER,
      memberOffsets,
      frame: f,
    });
    for (const n of memberNodes) superIdOfNode.set(n.id, superId);
  }

  for (const n of nodes) {
    if (clusterOf.has(n.id)) continue;
    supers.push({
      id: n.id,
      kind: "node",
      w: NODE_W,
      h: estimateNodeHeight(n),
      node: n,
    });
    superIdOfNode.set(n.id, n.id);
  }

  // ── super-edges ──────────────────────────────────────────────────────────
  // Fold every underlying edge into a super-edge between the two super-nodes
  // its endpoints belong to. Self-loops (edge stays inside one cluster) drop
  // out. Duplicates collapse to one super-edge.
  const superEdgeKeys = new Set<string>();
  const superEdges: Edge[] = [];
  for (const e of edges) {
    const a = superIdOfNode.get(e.fromNodeId);
    const b = superIdOfNode.get(e.toNodeId);
    if (!a || !b || a === b) continue;
    const key = `${a}${b}`;
    if (superEdgeKeys.has(key)) continue;
    superEdgeKeys.add(key);
    // pin labels are unused at the super level.
    superEdges.push({ fromNodeId: a, fromPin: "out", toNodeId: b, toPin: "in" });
  }

  // ── column-pack super-nodes ──────────────────────────────────────────────
  // Same depth + barycentric algorithm as layoutFlat, but operating on the
  // super-node footprints rather than fixed node sizes.
  const superById = new Map(supers.map((s) => [s.id, s] as const));
  const indices = new Map(supers.map((s, i) => [s.id, i] as const));
  const incoming: number[][] = supers.map(() => []);
  const outgoing: number[][] = supers.map(() => []);
  for (const e of superEdges) {
    const from = indices.get(e.fromNodeId);
    const to = indices.get(e.toNodeId);
    if (from === undefined || to === undefined) continue;
    outgoing[from]!.push(to);
    incoming[to]!.push(from);
  }
  const depth = computeDepth(supers.length, incoming);
  const maxDepth = Math.max(0, ...depth);
  const columns: number[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (let i = 0; i < supers.length; i++) columns[depth[i]!]!.push(i);
  for (let pass = 0; pass < 2; pass++) {
    for (let c = 1; c <= maxDepth; c++) reorderByBarycenter(columns[c]!, incoming, columns[c - 1]!);
    for (let c = maxDepth - 1; c >= 0; c--)
      reorderByBarycenter(columns[c]!, outgoing, columns[c + 1]!);
  }

  // ── place columns with variable widths ───────────────────────────────────
  // x positions: each column's x is the max of (prev x + max width of prev
  // column) + COL_GAP_X. y positions stack with each super's height + a
  // larger inter-cluster gap when adjacent supers are clusters.
  const colXs: number[] = [];
  let xCursor = 0;
  for (let c = 0; c <= maxDepth; c++) {
    colXs.push(xCursor);
    let maxW = 0;
    for (const i of columns[c]!) if (supers[i]!.w > maxW) maxW = supers[i]!.w;
    xCursor += maxW + COL_GAP_X;
  }

  const superPos = new Map<string, { x: number; y: number }>();
  const colHeights: number[] = [];
  for (let c = 0; c <= maxDepth; c++) {
    let y = 0;
    let prevWasCluster = false;
    for (const i of columns[c]!) {
      const s = supers[i]!;
      if (y > 0) y += s.kind === "cluster" || prevWasCluster ? FRAME_GAP_Y : ROW_GAP_Y;
      superPos.set(s.id, { x: colXs[c]!, y });
      y += s.h;
      prevWasCluster = s.kind === "cluster";
    }
    colHeights.push(y);
  }

  // Center each column vertically against the tallest one.
  const tallest = Math.max(0, ...colHeights);
  for (let c = 0; c <= maxDepth; c++) {
    const colH = colHeights[c] ?? 0;
    const offset = (tallest - colH) / 2;
    if (offset === 0) continue;
    for (const i of columns[c]!) {
      const p = superPos.get(supers[i]!.id)!;
      p.y += offset;
    }
  }

  // ── translate cluster members and emit final nodes / frames ──────────────
  const newNodes: GraphNode[] = [];
  const newFrames: Frame[] = [];
  for (const s of supers) {
    const p = superPos.get(s.id)!;
    if (s.kind === "node") {
      newNodes.push({ ...s.node!, position: { x: p.x, y: p.y } });
    } else {
      // Cluster — frame anchored at super position; members at sub-offsets
      // relative to the frame.
      newFrames.push({
        ...s.frame!,
        position: { x: p.x, y: p.y },
        size: { width: s.w, height: s.h },
        nodeIds: s.frame!.nodeIds ? [...s.frame!.nodeIds] : undefined,
      });
      for (const [memberId, offset] of s.memberOffsets!) {
        const original = nodes.find((n) => n.id === memberId);
        if (!original) continue;
        newNodes.push({
          ...original,
          position: { x: p.x + offset.x, y: p.y + offset.y },
        });
      }
    }
  }

  // Preserve any passive (user-drawn) frames untouched — they're spatial
  // overlays the user can drag around themselves.
  for (const f of passiveFrames) newFrames.push({ ...f });

  return {
    nodes: newNodes,
    edges: edges.map((e) => ({ ...e })),
    ...(newFrames.length > 0 ? { frames: newFrames } : {}),
  };
}

// ============================================================================
// Flat layout — the original column algorithm, parameterised on (nodes, edges)
// so it's reusable for sub-cluster layouts.

function layoutFlat(nodes: GraphNode[], edges: Edge[]): GraphNode[] {
  if (nodes.length === 0) return [];

  const idx = new Map(nodes.map((n, i) => [n.id, i] as const));
  const incoming: number[][] = nodes.map(() => []);
  const outgoing: number[][] = nodes.map(() => []);
  for (const e of edges) {
    const from = idx.get(e.fromNodeId);
    const to = idx.get(e.toNodeId);
    if (from === undefined || to === undefined) continue;
    outgoing[from]!.push(to);
    incoming[to]!.push(from);
  }

  const depth = computeDepth(nodes.length, incoming);
  const maxDepth = Math.max(0, ...depth);

  const columns: number[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (let i = 0; i < nodes.length; i++) columns[depth[i]!]!.push(i);

  for (let pass = 0; pass < 2; pass++) {
    for (let c = 1; c <= maxDepth; c++) reorderByBarycenter(columns[c]!, incoming, columns[c - 1]!);
    for (let c = maxDepth - 1; c >= 0; c--)
      reorderByBarycenter(columns[c]!, outgoing, columns[c + 1]!);
  }

  const heights = nodes.map((n) => estimateNodeHeight(n));
  const newNodes = nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } }));
  const columnHeights: number[] = [];
  for (let c = 0; c <= maxDepth; c++) {
    let y = 0;
    for (const i of columns[c]!) {
      newNodes[i]!.position = { x: c * (NODE_W + COL_GAP_X), y };
      y += heights[i]! + ROW_GAP_Y;
    }
    columnHeights.push(y - ROW_GAP_Y);
  }

  const tallest = Math.max(0, ...columnHeights);
  for (let c = 0; c <= maxDepth; c++) {
    const colH = columnHeights[c] ?? 0;
    const offset = (tallest - colH) / 2;
    if (offset === 0) continue;
    for (const i of columns[c]!) {
      newNodes[i]!.position.y += offset;
    }
  }

  return newNodes;
}

/**
 * Longest-path depth from any source node. Done iteratively in topological
 * order using Kahn's algorithm. Cycles (which shouldn't occur in our DAG)
 * fall back to depth 0 for the offending nodes.
 */
function computeDepth(count: number, incoming: readonly number[][]): number[] {
  const indegree = incoming.map((arr) => arr.length);
  const depth = new Array<number>(count).fill(0);
  const queue: number[] = [];
  for (let i = 0; i < count; i++) if (indegree[i] === 0) queue.push(i);
  const outAdj: number[][] = Array.from({ length: count }, () => []);
  for (let to = 0; to < count; to++) {
    for (const from of incoming[to]!) outAdj[from]!.push(to);
  }
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of outAdj[u]!) {
      const d = depth[u]! + 1;
      if (d > depth[v]!) depth[v] = d;
      if (--indegree[v]! === 0) queue.push(v);
    }
  }
  return depth;
}

/**
 * Reorder `column` so each node's rank matches the average rank of its
 * neighbours in `ref`. Standard barycentric heuristic.
 */
function reorderByBarycenter(
  column: number[],
  adj: readonly number[][],
  ref: readonly number[],
): void {
  const refRank = new Map<number, number>();
  ref.forEach((id, i) => refRank.set(id, i));
  const bary = (i: number): number => {
    const neigh = adj[i]!;
    if (neigh.length === 0) return Number.POSITIVE_INFINITY;
    let sum = 0;
    let count = 0;
    for (const n of neigh) {
      const r = refRank.get(n);
      if (r !== undefined) {
        sum += r;
        count++;
      }
    }
    return count > 0 ? sum / count : Number.POSITIVE_INFINITY;
  };
  column.sort((a, b) => bary(a) - bary(b));
}
