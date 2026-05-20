// Layered auto-layout for node graphs, powered by dagre. Used by the preset
// builder so authored presets land with a readable left-to-right column
// layout, and by the "Tidy" button in the editor so users can re-layout their
// own graphs.
//
// Frames with explicit `nodeIds` are treated as cluster super-nodes: their
// members lay out as a sub-graph, the cluster is sized by that sub-layout's
// bbox plus padding, and the outer pass packs the cluster as a single
// rectangle. Frames without `nodeIds` (user-drawn) are pure spatial overlays
// and are left alone here.

import dagre from "@dagrejs/dagre";

import { NODE_W, nodeHeight, wiredInputsByNode } from "./node-metrics";
import type { Edge, Frame, GraphNode, NodeGraph } from "./types";

const COL_GAP_X = 80;
const ROW_GAP_Y = 24;

// Padding & header allowance applied around each cluster's sub-layout bbox.
const FRAME_PADDING = 24;
const FRAME_HEADER = 32;
// Extra vertical breathing room added to cluster super-nodes so the coloured
// backplates don't visually fuse against neighbouring nodes.
const CLUSTER_EXTRA_PAD_Y = 6;

/**
 * Compute new positions for every node and frame in the graph. Returns a
 * fresh NodeGraph; the input is not mutated. Frames with `nodeIds` are
 * treated as clusters; frames without are passed through unchanged.
 */
export function layoutGraph(graph: NodeGraph): NodeGraph {
  const allFrames = graph.frames ?? [];
  const clusterFrames = allFrames.filter((f) => f.nodeIds && f.nodeIds.length > 0);
  const passiveFrames = allFrames.filter((f) => !f.nodeIds || f.nodeIds.length === 0);
  // Wired-input set is global: an input pin that has any incoming edge renders
  // wired (short row), even if the edge crosses a cluster boundary. Compute
  // once and thread through.
  const wiredByNode = wiredInputsByNode(graph.edges);

  if (clusterFrames.length === 0) {
    const positioned = runDagre(graph.nodes, graph.edges, wiredByNode);
    return {
      nodes: positioned,
      edges: graph.edges.map((e) => ({ ...e })),
      ...(passiveFrames.length > 0 ? { frames: passiveFrames.map((f) => ({ ...f })) } : {}),
    };
  }

  return layoutWithClusters(graph.nodes, graph.edges, clusterFrames, passiveFrames, wiredByNode);
}

/** Apply `layoutGraph` to the given graph and return a fresh NodeGraph. */
export function relayoutGraph(graph: NodeGraph): NodeGraph {
  return layoutGraph(graph);
}

// ============================================================================
// Cluster-aware layout

interface SuperNode {
  id: string;
  // Footprint width and height — what the outer dagre pass reasons about.
  w: number;
  h: number;
  kind: "node" | "cluster";
  // For cluster super-nodes: the member sub-positions (top-left, relative to
  // the cluster's own top-left) and the originating frame definition.
  memberOffsets?: Map<string, { x: number; y: number }>;
  frame?: Frame;
  node?: GraphNode;
}

const EMPTY_PIN_SET: ReadonlySet<string> = new Set();

function wiredOf(map: Map<string, Set<string>>, id: string): ReadonlySet<string> {
  return map.get(id) ?? EMPTY_PIN_SET;
}

function layoutWithClusters(
  nodes: GraphNode[],
  edges: Edge[],
  clusterFrames: Frame[],
  passiveFrames: Frame[],
  wiredByNode: Map<string, Set<string>>,
): NodeGraph {
  // Each node belongs to at most one cluster. If two frames claim the same
  // node, the first wins — preset authors shouldn't double-claim, but a
  // deterministic tie-break keeps the output sane if they do.
  const clusterOf = new Map<string, string>();
  for (const f of clusterFrames) {
    for (const nid of f.nodeIds!) {
      if (!clusterOf.has(nid)) clusterOf.set(nid, f.id);
    }
  }

  // O(1) lookups by node id; reused below for cluster grouping and member
  // translation.
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
  const membersByFrame = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    const fid = clusterOf.get(n.id);
    if (!fid) continue;
    const list = membersByFrame.get(fid);
    if (list) list.push(n);
    else membersByFrame.set(fid, [n]);
  }

  const supers: SuperNode[] = [];
  const superIdOfNode = new Map<string, string>();

  for (const f of clusterFrames) {
    const memberNodes = membersByFrame.get(f.id);
    if (!memberNodes || memberNodes.length === 0) continue;
    const memberSet = new Set(memberNodes.map((n) => n.id));
    const intraEdges = edges.filter(
      (e) => memberSet.has(e.fromNodeId) && memberSet.has(e.toNodeId),
    );
    const subLaid = runDagre(memberNodes, intraEdges, wiredByNode);
    // Normalize sub-positions to (0, 0) origin and compute footprint.
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of subLaid) {
      const h = nodeHeight(n, wiredOf(wiredByNode, n.id));
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
      h: nodeHeight(n, wiredOf(wiredByNode, n.id)),
      node: n,
    });
    superIdOfNode.set(n.id, n.id);
  }

  // Cluster super-nodes get a touch of extra vertical padding so the coloured
  // backplates don't visually fuse against adjacent nodes. Self-loops (edges
  // confined to one cluster) and duplicate super-edges are silently dropped
  // by dagre's non-multigraph setEdge.
  const g = newDagreGraph();
  for (const s of supers) {
    const h = s.kind === "cluster" ? s.h + CLUSTER_EXTRA_PAD_Y * 2 : s.h;
    g.setNode(s.id, { width: s.w, height: h });
  }
  for (const e of edges) {
    const a = superIdOfNode.get(e.fromNodeId);
    const b = superIdOfNode.get(e.toNodeId);
    if (!a || !b || a === b) continue;
    g.setEdge(a, b);
  }
  dagre.layout(g);

  const newNodes: GraphNode[] = [];
  const newFrames: Frame[] = [];
  for (const s of supers) {
    const lay = g.node(s.id);
    // dagre returns the CENTER of each node; convert to top-left. The cluster
    // padding extends symmetrically around the box, so the padded and unpadded
    // boxes share a center — `lay.y - s.h/2` is the correct top-left for both.
    const x = lay.x - s.w / 2;
    const y = lay.y - s.h / 2;
    if (s.kind === "node") {
      newNodes.push({ ...s.node!, position: { x, y } });
      continue;
    }
    newFrames.push({
      ...s.frame!,
      position: { x, y },
      size: { width: s.w, height: s.h },
      nodeIds: s.frame!.nodeIds ? [...s.frame!.nodeIds] : undefined,
    });
    for (const [memberId, offset] of s.memberOffsets!) {
      const original = nodeById.get(memberId);
      if (!original) continue;
      newNodes.push({
        ...original,
        position: { x: x + offset.x, y: y + offset.y },
      });
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
// Flat layout via dagre — used both for top-level graphs and for cluster
// sub-graphs.

function runDagre(
  nodes: GraphNode[],
  edges: Edge[],
  wiredByNode: Map<string, Set<string>>,
): GraphNode[] {
  if (nodes.length === 0) return [];

  const g = newDagreGraph();
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    g.setNode(n.id, { width: NODE_W, height: nodeHeight(n, wiredOf(wiredByNode, n.id)) });
  }
  for (const e of edges) {
    if (!nodeIds.has(e.fromNodeId) || !nodeIds.has(e.toNodeId)) continue;
    g.setEdge(e.fromNodeId, e.toNodeId);
  }
  dagre.layout(g);

  return nodes.map((n) => {
    const lay = g.node(n.id);
    const h = nodeHeight(n, wiredOf(wiredByNode, n.id));
    // dagre reports centers; convert to top-left to match the rest of the
    // editor's coordinate convention.
    return { ...n, position: { x: lay.x - NODE_W / 2, y: lay.y - h / 2 } };
  });
}

function newDagreGraph() {
  const g = new dagre.graphlib.Graph({ multigraph: false, compound: false });
  g.setGraph({
    rankdir: "LR",
    nodesep: ROW_GAP_Y,
    ranksep: COL_GAP_X,
    marginx: 0,
    marginy: 0,
    ranker: "network-simplex",
  });
  g.setDefaultEdgeLabel(() => ({}));
  return g;
}
