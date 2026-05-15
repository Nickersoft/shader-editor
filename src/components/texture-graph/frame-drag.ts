// Frame-drag containment. Blender-style: when the user grabs a frame, every
// node (and nested frame) whose center lies inside the frame's bbox at drag
// start is captured and slides with the frame. Membership is purely spatial —
// there's no formal parenting relationship, so dropping a node into a frame
// later or sliding it out doesn't require any explicit action.
//
// Lives outside the editor component so the logic is testable in isolation
// and the recursive containment walk doesn't pay the O(F²·N) cost it did
// inline: `framesById` is built once and shared across recursion levels.

import type { Frame, NodeGraph } from "@/shaders/node-graph";

/** Approximate node footprint for center-in-bbox tests. */
export const NODE_W_EST = 200;
export const NODE_H_EST = 110;

export interface FrameDragCapture {
  frameStartPos: { x: number; y: number };
  nodeStartPositions: Map<string, { x: number; y: number }>;
  frameStartPositions: Map<string, { x: number; y: number }>;
}

/**
 * Snapshot every node and frame that should move with `frameId` if the user
 * starts dragging it. Recurses into nested frames so dragging an outer frame
 * carries inner frames *and their members* — even if a member node sits just
 * outside the outer frame's bbox.
 */
export function captureFrameContents(
  graph: NodeGraph,
  frameId: string,
): FrameDragCapture | null {
  const frames = graph.frames ?? [];
  const framesById = new Map<string, Frame>();
  for (const f of frames) framesById.set(f.id, f);

  const root = framesById.get(frameId);
  if (!root) return null;

  const nodeStartPositions = new Map<string, { x: number; y: number }>();
  const frameStartPositions = new Map<string, { x: number; y: number }>();

  const visitFrame = (f: Frame) => {
    const x2 = f.position.x + f.size.width;
    const y2 = f.position.y + f.size.height;
    // Node membership: any primitive whose center sits inside this frame's
    // bbox. A node already captured by an outer frame keeps its outermost
    // start position — `has` guards against overwriting.
    for (const node of graph.nodes) {
      if (nodeStartPositions.has(node.id)) continue;
      const cx = node.position.x + NODE_W_EST / 2;
      const cy = node.position.y + NODE_H_EST / 2;
      if (cx >= f.position.x && cx <= x2 && cy >= f.position.y && cy <= y2) {
        nodeStartPositions.set(node.id, { ...node.position });
      }
    }
    // Frame membership: any other frame whose center sits inside this one.
    // Recurse to capture that frame's own members too.
    for (const other of frames) {
      if (other.id === f.id) continue;
      if (frameStartPositions.has(other.id)) continue;
      const ocx = other.position.x + other.size.width / 2;
      const ocy = other.position.y + other.size.height / 2;
      if (ocx >= f.position.x && ocx <= x2 && ocy >= f.position.y && ocy <= y2) {
        frameStartPositions.set(other.id, { ...other.position });
        visitFrame(other);
      }
    }
  };

  visitFrame(root);

  return {
    frameStartPos: { ...root.position },
    nodeStartPositions,
    frameStartPositions,
  };
}
