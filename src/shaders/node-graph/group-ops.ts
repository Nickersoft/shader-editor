// Make-group and ungroup operations.
//
// makeGroup wraps a selection of nodes into a single group node whose body is
// a new subGraph. ungroup is the inverse — it splices a group's contents back
// into its parent and removes the wrapper. Both are pure functions on the
// graph value; the composer applies their results in place.
//
// The boundary analysis walks the parent graph's edges and partitions them
// into internal / incoming / outgoing relative to the selection. Each unique
// (target node, target pin) on the incoming side becomes one external input
// pin on the group; each unique (source node, source pin) on the outgoing
// side becomes one external output pin. Pin types are read from the involved
// primitives so the synthesised GroupInput / GroupOutput pin shapes line up
// with the actual GLSL types flowing across the boundary.

import { makeId } from "@/lib/utils";
import { GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID, GROUP_TYPE_ID } from "./emit";
import { getPrimitive } from "./registry";
import type { Edge, GraphNode, NodeGraph, PinSpec, PinType } from "./types";

const STRUCTURAL_TYPE_IDS = new Set([GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID]);

interface SynthesisedPin {
  id: string;
  type: PinType;
  label: string;
  default?: unknown;
  subtype?: PinSpec["subtype"];
}

/**
 * Wrap `selectedNodeIds` into a new group node. Returns the new group's id,
 * or null if the selection is invalid (empty, includes a GroupInput/Output,
 * or contains an unknown node).
 *
 * Pin-type rule: incoming external inputs derive their type from the *target*
 * pin (the consumer's expected type, so internal wiring works without
 * coercion); outgoing external outputs derive theirs from the *source* pin
 * (the producer's actual type).
 *
 * Position rule: the new group node lands at the selection's centroid; the
 * moved nodes are normalised so their bbox top-left lands at (200, 80) inside
 * the subGraph, leaving room on the left for the GroupInput and on the right
 * (after the bbox) for the GroupOutput.
 */
export function makeGroup(graph: NodeGraph, selectedNodeIds: readonly string[]): string | null {
  if (selectedNodeIds.length === 0) return null;
  const selected = new Set(selectedNodeIds);
  const selectedNodes: GraphNode[] = [];
  for (const id of selectedNodeIds) {
    const n = graph.nodes.find((nn) => nn.id === id);
    if (!n) return null;
    if (STRUCTURAL_TYPE_IDS.has(n.typeId)) return null;
    selectedNodes.push(n);
  }

  // Partition edges. Same (toNodeId, toPin) may receive only one edge by the
  // composer's invariant, so the incoming dedup key is just `to:pin`. For
  // outgoing, multiple consumers may read the same source pin — dedup on
  // `from:pin` so they share one external output pin.
  const internalEdges: Edge[] = [];
  const incomingByKey = new Map<string, { edge: Edge; pinType: PinType; pinSpec: PinSpec }>();
  const outgoingByKey = new Map<string, { fromNodeId: string; fromPin: string; pinType: PinType; pinSpec: PinSpec; edges: Edge[] }>();

  for (const e of graph.edges) {
    const fromIn = selected.has(e.fromNodeId);
    const toIn = selected.has(e.toNodeId);
    if (fromIn && toIn) {
      internalEdges.push(e);
    } else if (toIn) {
      const targetPin = pinSpecOf(graph, e.toNodeId, e.toPin, "input");
      if (!targetPin) return null;
      const key = `${e.toNodeId}:${e.toPin}`;
      incomingByKey.set(key, { edge: e, pinType: targetPin.type, pinSpec: targetPin });
    } else if (fromIn) {
      const sourcePin = pinSpecOf(graph, e.fromNodeId, e.fromPin, "output");
      if (!sourcePin) return null;
      const key = `${e.fromNodeId}:${e.fromPin}`;
      const existing = outgoingByKey.get(key);
      if (existing) {
        existing.edges.push(e);
      } else {
        outgoingByKey.set(key, {
          fromNodeId: e.fromNodeId,
          fromPin: e.fromPin,
          pinType: sourcePin.type,
          pinSpec: sourcePin,
          edges: [e],
        });
      }
    }
  }

  // Synthesise GroupInput pins (one per unique incoming target pin).
  const gInputPins: SynthesisedPin[] = [];
  const incomingToInPin = new Map<string, string>(); // "toNodeId:toPin" → synthesised pin id
  let inIdx = 0;
  for (const [key, info] of incomingByKey) {
    const pinId = `in_${inIdx}`;
    incomingToInPin.set(key, pinId);
    gInputPins.push({
      id: pinId,
      type: info.pinType,
      label: info.pinSpec.label ?? pinId,
      default: info.pinSpec.default,
      subtype: info.pinSpec.subtype,
    });
    inIdx += 1;
  }

  // Synthesise GroupOutput pins (one per unique outgoing source pin).
  const gOutputPins: SynthesisedPin[] = [];
  const outgoingToOutPin = new Map<string, string>(); // "fromNodeId:fromPin" → synthesised pin id
  let outIdx = 0;
  for (const [key, info] of outgoingByKey) {
    const pinId = `out_${outIdx}`;
    outgoingToOutPin.set(key, pinId);
    gOutputPins.push({
      id: pinId,
      type: info.pinType,
      label: info.pinSpec.label ?? pinId,
      default: info.pinSpec.default,
      subtype: info.pinSpec.subtype,
    });
    outIdx += 1;
  }

  // Position normalisation. Compute the selection bbox in parent coords, then
  // shift each moved node so the bbox lands at (200, 80) inside the subGraph.
  const minX = Math.min(...selectedNodes.map((n) => n.position.x));
  const minY = Math.min(...selectedNodes.map((n) => n.position.y));
  const maxX = Math.max(...selectedNodes.map((n) => n.position.x));
  const SUB_OFFSET = { x: 200, y: 80 };
  const SUB_RIGHT_MARGIN = 280;

  const movedNodes: GraphNode[] = selectedNodes.map((n) => ({
    ...n,
    position: {
      x: n.position.x - minX + SUB_OFFSET.x,
      y: n.position.y - minY + SUB_OFFSET.y,
    },
  }));

  const subGraph: NodeGraph = {
    nodes: [
      {
        id: makeId("group-input"),
        typeId: GROUP_INPUT_TYPE_ID,
        config: { pins: gInputPins },
        position: { x: 0, y: SUB_OFFSET.y },
      },
      ...movedNodes,
      {
        id: makeId("group-output"),
        typeId: GROUP_OUTPUT_TYPE_ID,
        config: { pins: gOutputPins },
        position: { x: maxX - minX + SUB_OFFSET.x + SUB_RIGHT_MARGIN, y: SUB_OFFSET.y },
      },
    ],
    edges: [],
  };

  const subGI = subGraph.nodes[0];
  const subGO = subGraph.nodes[subGraph.nodes.length - 1];

  // Inner edges: GroupInput → consumers, then internal, then producers → GroupOutput.
  for (const [key, info] of incomingByKey) {
    subGraph.edges.push({
      fromNodeId: subGI.id,
      fromPin: incomingToInPin.get(key)!,
      toNodeId: info.edge.toNodeId,
      toPin: info.edge.toPin,
    });
  }
  for (const e of internalEdges) {
    subGraph.edges.push({ ...e });
  }
  for (const [key, info] of outgoingByKey) {
    subGraph.edges.push({
      fromNodeId: info.fromNodeId,
      fromPin: info.fromPin,
      toNodeId: subGO.id,
      toPin: outgoingToOutPin.get(key)!,
    });
  }

  // Build the new group node. Position is the selection's centroid in parent
  // coords — visually replaces the selection's cluster.
  const newGroupId = makeId(GROUP_TYPE_ID);
  const centroid = {
    x: selectedNodes.reduce((s, n) => s + n.position.x, 0) / selectedNodes.length,
    y: selectedNodes.reduce((s, n) => s + n.position.y, 0) / selectedNodes.length,
  };
  const groupNode: GraphNode = {
    id: newGroupId,
    typeId: GROUP_TYPE_ID,
    config: { subGraph, label: "Group" },
    position: centroid,
  };

  // Rewrite the parent graph: drop selected nodes, drop internal/incoming/
  // outgoing edges, splice in the new group node and re-target external edges
  // to the group's synthesised pins.
  graph.nodes = graph.nodes.filter((n) => !selected.has(n.id)).concat(groupNode);

  const rewrittenEdges: Edge[] = [];
  for (const e of graph.edges) {
    const fromIn = selected.has(e.fromNodeId);
    const toIn = selected.has(e.toNodeId);
    if (fromIn && toIn) continue; // internal — moved into subGraph
    if (toIn) {
      const pinId = incomingToInPin.get(`${e.toNodeId}:${e.toPin}`);
      if (!pinId) continue;
      rewrittenEdges.push({
        fromNodeId: e.fromNodeId,
        fromPin: e.fromPin,
        toNodeId: newGroupId,
        toPin: pinId,
      });
      continue;
    }
    if (fromIn) {
      const pinId = outgoingToOutPin.get(`${e.fromNodeId}:${e.fromPin}`);
      if (!pinId) continue;
      rewrittenEdges.push({
        fromNodeId: newGroupId,
        fromPin: pinId,
        toNodeId: e.toNodeId,
        toPin: e.toPin,
      });
      continue;
    }
    rewrittenEdges.push(e);
  }
  graph.edges = rewrittenEdges;

  return newGroupId;
}

/**
 * Unwrap `groupNodeId`'s subGraph back into the parent. Returns the array of
 * surfaced node ids (selection-restore convenience), or null if the node is
 * not a group or its subGraph is malformed.
 *
 * Position rule: child nodes are translated by the group node's position
 * minus the subGraph's internal origin (the GroupInput's x coord) so they
 * land in the same visual area where the group sat.
 */
export function ungroup(graph: NodeGraph, groupNodeId: string): readonly string[] | null {
  const group = graph.nodes.find((n) => n.id === groupNodeId);
  if (!group || group.typeId !== GROUP_TYPE_ID) return null;
  const sub = (group.config as { subGraph?: NodeGraph }).subGraph;
  if (!sub) return null;

  const innerGI = sub.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID);
  const innerGO = sub.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);

  // Children = inner nodes excluding GI/GO. Translate them into parent coords.
  // The translation pins their internal origin to the group node's position.
  const innerOriginX = innerGI?.position.x ?? 0;
  const innerOriginY = innerGI?.position.y ?? 0;
  const children: GraphNode[] = sub.nodes
    .filter((n) => n.typeId !== GROUP_INPUT_TYPE_ID && n.typeId !== GROUP_OUTPUT_TYPE_ID)
    .map((n) => ({
      ...n,
      position: {
        x: n.position.x - innerOriginX + group.position.x,
        y: n.position.y - innerOriginY + group.position.y,
      },
    }));

  // Build lookup: inner GroupInput pin id → its outgoing edge targets.
  // When the parent had an incoming edge into the group at external pin X,
  // we redirect it to whatever the inner GroupInput.X feeds.
  const giOutByPin = new Map<string, Edge[]>(); // pin id → edges from GI.pin
  if (innerGI) {
    for (const e of sub.edges) {
      if (e.fromNodeId === innerGI.id) {
        const list = giOutByPin.get(e.fromPin);
        if (list) list.push(e);
        else giOutByPin.set(e.fromPin, [e]);
      }
    }
  }
  // Inner GroupOutput pin id → its single incoming edge source.
  const goInByPin = new Map<string, Edge>();
  if (innerGO) {
    for (const e of sub.edges) {
      if (e.toNodeId === innerGO.id) goInByPin.set(e.toPin, e);
    }
  }

  // Surface internal child-to-child edges directly.
  const surfacedEdges: Edge[] = [];
  for (const e of sub.edges) {
    if (innerGI && e.fromNodeId === innerGI.id) continue;
    if (innerGO && e.toNodeId === innerGO.id) continue;
    surfacedEdges.push({ ...e });
  }

  // Reconnect parent edges that crossed the group boundary.
  const parentEdges: Edge[] = [];
  for (const e of graph.edges) {
    if (e.toNodeId === groupNodeId) {
      // External → group.<pin>; resurface to whatever GI.<pin> fed.
      const giEdges = giOutByPin.get(e.toPin) ?? [];
      for (const innerEdge of giEdges) {
        parentEdges.push({
          fromNodeId: e.fromNodeId,
          fromPin: e.fromPin,
          toNodeId: innerEdge.toNodeId,
          toPin: innerEdge.toPin,
        });
      }
      continue;
    }
    if (e.fromNodeId === groupNodeId) {
      // group.<pin> → external; resurface from whatever fed GO.<pin>.
      const innerEdge = goInByPin.get(e.fromPin);
      if (!innerEdge) continue;
      parentEdges.push({
        fromNodeId: innerEdge.fromNodeId,
        fromPin: innerEdge.fromPin,
        toNodeId: e.toNodeId,
        toPin: e.toPin,
      });
      continue;
    }
    parentEdges.push(e);
  }

  graph.nodes = graph.nodes.filter((n) => n.id !== groupNodeId).concat(children);
  graph.edges = [...parentEdges, ...surfacedEdges];

  return children.map((c) => c.id);
}

function pinSpecOf(
  graph: NodeGraph,
  nodeId: string,
  pinId: string,
  side: "input" | "output",
): PinSpec | null {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const prim = getPrimitive(node.typeId);
  if (!prim) return null;
  const pins = side === "input" ? prim.inputs(node.config) : prim.outputs(node.config);
  return pins.find((p) => p.id === pinId) ?? null;
}
