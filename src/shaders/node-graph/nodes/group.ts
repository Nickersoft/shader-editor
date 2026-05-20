// Group — a node whose body is itself a NodeGraph. The group's external
// input/output pins are derived from the contained GroupInput / GroupOutput
// nodes inside its `subGraph`:
//
//   external inputs  ← inner GroupInput.outputs
//   external outputs ← inner GroupOutput.inputs
//
// Emit for group nodes is handled by a dedicated recursive path in
// `../emit.ts`. This primitive's own `emit()` is a no-op so palette previews
// and graph-display tooling that calls it directly still get a clean return
// rather than throwing.
//
// Storing `subGraph` inside `config` (rather than as a sibling field on
// GraphNode) keeps the existing `BaseNode.inputs(cfg)` / `outputs(cfg)`
// signatures untouched and inherits the standard config-driven uniform-path
// walker used by every other primitive.

import { z } from "zod";
import {
  BaseNode,
  register,
  requireNode,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import type { NodeGraph, PinSpec } from "../types";
import { GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID, GROUP_TYPE_ID } from "../emit";

// `subGraph` is stored as `z.unknown()` rather than a recursive Zod schema:
// NodeGraph references itself via Group, so a true schema would need lazy
// recursion. The emitter and editor walk the subgraph directly without
// re-validating, so a structural any is fine here.
const config = z.object({
  subGraph: z.unknown(),
  label: z.string().optional(),
});

type Config = z.infer<typeof config>;

export class Group extends BaseNode<Config> {
  static readonly typeId = GROUP_TYPE_ID;
  static readonly meta: NodeMeta = {
    name: "Group",
    category: "group",
    color: "#94a3b8",
    description: "A nested subgraph with its own exposed inputs and outputs.",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const sub = this.subGraphOf(cfg);
    if (!sub) return [];
    const gi = sub.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID);
    if (!gi) return [];
    // GroupInput's *outputs* are the parameters the subgraph exposes to its
    // host. The Group node's *inputs* feed those parameters from outside.
    return requireNode(GROUP_INPUT_TYPE_ID).outputs(gi.config);
  }

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const sub = this.subGraphOf(cfg);
    if (!sub) return [];
    const go = sub.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);
    if (!go) return [];
    // GroupOutput's *inputs* are the values the subgraph yields. The Group
    // node's *outputs* surface them to the parent graph.
    return requireNode(GROUP_OUTPUT_TYPE_ID).inputs(go.config);
  }

  displayTitle(cfg: Record<string, unknown>): string {
    return this.cfg(cfg).label || this.name;
  }

  emit(_ctx: EmitContext): EmitResult {
    return { statements: "" };
  }

  private subGraphOf(cfg: Record<string, unknown>): NodeGraph | undefined {
    const sub = this.cfg(cfg).subGraph;
    return isNodeGraph(sub) ? sub : undefined;
  }
}

function isNodeGraph(v: unknown): v is NodeGraph {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as { nodes?: unknown }).nodes) &&
    Array.isArray((v as { edges?: unknown }).edges)
  );
}

export default register(Group);
