// Aggregator that walks a NodeGraph (recursing through group subgraphs) and
// collects every primitive's SpatialControl declarations into a single flat
// list, rewriting each control's config-key references into graph-scoped
// addresses of the form `graph:<id1>/<id2>/.../<idN>:<originalKey>`.
//
// The node path is a chain from the root graph down through each nested
// group's `config.subGraph` to the primitive that owns the control. Most
// addresses have a one-element path (the common case: a primitive directly
// on the root graph); a primitive inside a group has a two-element path; a
// primitive inside a group inside a group has three; and so on.
//
// The canvas overlay parses that prefix in its readNumber/setField/setFields
// implementations to dispatch reads and writes into the right GraphNode's
// `config`, walking through subGraphs as needed. Controls whose addresses do
// not carry the prefix continue to flow through the legacy uniform-bag path
// used by shape nodes.

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
import { GROUP_TYPE_ID } from "./emit";
import { getNode } from "./registry";
import type { NodeGraph } from "./types";

export const GRAPH_ADDRESS_PREFIX = "graph:";
const PATH_SEPARATOR = "/";

/**
 * Compose a graph-scoped field address. Accepts either a single node id (the
 * legacy form, equivalent to a one-element path) or a full path through
 * nested groups, root → leaf.
 */
export function graphAddr(nodePath: string | readonly string[], key: string): string {
  const path = typeof nodePath === "string" ? nodePath : nodePath.join(PATH_SEPARATOR);
  return `${GRAPH_ADDRESS_PREFIX}${path}:${key}`;
}

export interface ParsedGraphAddress {
  /**
   * Chain of node ids from the root graph down through each nested group's
   * `config.subGraph` to the owning primitive. Length 1 for primitives on
   * the root graph (the common case).
   */
  nodePath: readonly string[];
  key: string;
}

/**
 * Parse an address string. Returns `null` for plain (legacy non-graph) keys;
 * returns `{ nodePath, key }` for graph-scoped addresses produced by
 * `graphAddr`. nodeIds are mint via `makeId` which never produces a `/`, so
 * the path split is unambiguous.
 */
export function parseGraphAddress(addr: string): ParsedGraphAddress | null {
  if (!addr.startsWith(GRAPH_ADDRESS_PREFIX)) return null;
  const rest = addr.slice(GRAPH_ADDRESS_PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep < 0) return null;
  const pathStr = rest.slice(0, sep);
  const key = rest.slice(sep + 1);
  if (pathStr.length === 0) return null;
  return { nodePath: pathStr.split(PATH_SEPARATOR), key };
}

/**
 * Walk every node in `graph` — recursing through group subgraphs — ask each
 * primitive for its `spatialControls`, and concatenate the results, rewriting
 * each control's address fields with the full root → leaf path.
 */
export function aggregateGraphSpatialControls(
  graph: NodeGraph,
): readonly SpatialControl[] {
  const out: SpatialControl[] = [];
  collect(graph, [], out);
  return out;
}

function collect(
  graph: NodeGraph,
  prefix: readonly string[],
  out: SpatialControl[],
): void {
  for (const node of graph.nodes) {
    const path: readonly string[] = [...prefix, node.id];
    const prim = getNode(node.typeId);
    const local = prim?.spatialControls?.(node);
    if (local && local.length > 0) {
      for (const c of local) out.push(rewriteAddresses(c, path));
    }
    if (node.typeId === GROUP_TYPE_ID) {
      const sub = (node.config as { subGraph?: NodeGraph }).subGraph;
      if (sub) collect(sub, path, out);
    }
  }
}

/** Rewrite every config-key field on a SpatialControl with a graph prefix. */
function rewriteAddresses(c: SpatialControl, nodePath: readonly string[]): SpatialControl {
  const r = (k: string) => graphAddr(nodePath, k);
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
