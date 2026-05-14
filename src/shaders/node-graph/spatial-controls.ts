// Aggregator that walks a NodeGraph and collects every primitive's
// SpatialControl declarations into a single flat list, rewriting each
// control's config-key references into graph-scoped addresses of the form
// `graph:<graphNodeId>:<originalKey>`.
//
// The canvas overlay parses that prefix in its readNumber/setField/setFields
// implementations to dispatch reads and writes into the right GraphNode's
// `config`. Controls whose addresses do not carry the prefix continue to flow
// through the legacy uniform-bag path used by shape nodes.

import type {
  SpatialControl,
  PointControl,
  RadiusControl,
  TransformControl,
  BoundingBoxControl,
  SegmentControl,
  PolygonControl,
  ColorStopControl,
  PointVec2Control,
  RadiusVec2Control,
  SegmentVec2Control,
  ColorStopVec2Control,
} from "@/shaders/core/spatial";
import { getPrimitive } from "./registry";
import type { NodeGraph } from "./types";

export const GRAPH_ADDRESS_PREFIX = "graph:";

/** Compose a graph-scoped field address. */
export function graphAddr(nodeId: string, key: string): string {
  return `${GRAPH_ADDRESS_PREFIX}${nodeId}:${key}`;
}

export interface ParsedGraphAddress {
  nodeId: string;
  key: string;
}

/**
 * Parse an address string. Returns `null` for plain (legacy) keys; returns
 * `{ nodeId, key }` for graph-scoped addresses produced by `graphAddr`.
 */
export function parseGraphAddress(addr: string): ParsedGraphAddress | null {
  if (!addr.startsWith(GRAPH_ADDRESS_PREFIX)) return null;
  const rest = addr.slice(GRAPH_ADDRESS_PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep < 0) return null;
  return { nodeId: rest.slice(0, sep), key: rest.slice(sep + 1) };
}

/**
 * Walk every node in `graph`, ask each primitive for its `spatialControls`,
 * and concatenate the results — rewriting every config-key field to a
 * graph-scoped address so the overlay can dispatch reads and writes back into
 * the originating graph node.
 */
export function aggregateGraphSpatialControls(
  graph: NodeGraph,
): readonly SpatialControl[] {
  const out: SpatialControl[] = [];
  for (const node of graph.nodes) {
    const prim = getPrimitive(node.typeId);
    const local = prim?.spatialControls?.(node);
    if (!local || local.length === 0) continue;
    for (const c of local) out.push(rewriteAddresses(c, node.id));
  }
  return out;
}

/** Rewrite every config-key field on a SpatialControl with a graph prefix. */
function rewriteAddresses(c: SpatialControl, nodeId: string): SpatialControl {
  const r = (k: string) => graphAddr(nodeId, k);
  switch (c.kind) {
    case "point":
      return { ...c, x: r(c.x), y: r(c.y) } satisfies PointControl;
    case "radius":
      return {
        ...c,
        cx: r(c.cx),
        cy: r(c.cy),
        r: r(c.r),
      } satisfies RadiusControl;
    case "transform":
      return {
        ...c,
        x: r(c.x),
        y: r(c.y),
        w: r(c.w),
        h: r(c.h),
        rotation: r(c.rotation),
      } satisfies TransformControl;
    case "boundingBox":
      return {
        ...c,
        cx: r(c.cx),
        cy: r(c.cy),
        w: r(c.w),
        h: r(c.h),
      } satisfies BoundingBoxControl;
    case "segment":
      return {
        ...c,
        from: [r(c.from[0]), r(c.from[1])],
        to: [r(c.to[0]), r(c.to[1])],
      } satisfies SegmentControl;
    case "polygon":
      return {
        ...c,
        points: c.points.map((p) => [r(p[0]), r(p[1])] as [string, string]),
      } satisfies PolygonControl;
    case "colorStop":
      return {
        ...c,
        x: r(c.x),
        y: r(c.y),
        color: r(c.color),
      } satisfies ColorStopControl;
    case "pointVec2":
      return {
        ...c,
        key: r(c.key),
        ...(c.color ? { color: r(c.color) } : {}),
      } satisfies PointVec2Control;
    case "radiusVec2":
      return {
        ...c,
        center: r(c.center),
        r: r(c.r),
        ...(c.color ? { color: r(c.color) } : {}),
      } satisfies RadiusVec2Control;
    case "segmentVec2":
      return {
        ...c,
        from: r(c.from),
        to: r(c.to),
        ...(c.colorFrom ? { colorFrom: r(c.colorFrom) } : {}),
        ...(c.colorTo ? { colorTo: r(c.colorTo) } : {}),
      } satisfies SegmentVec2Control;
    case "colorStopVec2":
      return {
        ...c,
        key: r(c.key),
        color: r(c.color),
      } satisfies ColorStopVec2Control;
  }
}
