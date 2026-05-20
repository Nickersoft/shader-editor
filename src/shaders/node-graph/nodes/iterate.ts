// Iterate — runs an inner subgraph N times with feedback accumulator pins.
// Structural twin of `Group`, but `count` is a compile-time constant and the
// inner graph reads/writes accumulator state that threads across iterations.
//
// Layout:
//
//   config:
//     count          compile-time integer (1..16)
//     accumulators   list of {name, type, initial} declarations
//     subGraph       the body graph (one GroupInput + one GroupOutput inside)
//     label          optional title override
//
//   external pins, derived from the inner GroupInput's `pins` config:
//     - inputs:  each non-accumulator, non-index pin (constants per iteration)
//     - outputs: one per accumulator (final value after `count` passes), plus
//                any non-accumulator GroupOutput pins from the final pass
//
//   inner subgraph convention:
//     GroupInput exposes:
//       - the external constant inputs (any IDs the author chooses)
//       - `${name}_in`  for each accumulator — the value coming into this pass
//       - `index`       — int pin, 0..count-1, supplied by the iterate emitter
//     GroupOutput accepts:
//       - `${name}_out` for each accumulator — the value flowing to the next pass
//       - optionally non-accumulator outputs (passed through from final pass only)
//
// The convention is enforced by `emitIterateNode` in emit.ts; this file only
// defines the config schema, the pin-shape projection, and a static
// `accumulatorPinIds` helper that the emitter and editor share.

import { z } from "zod";

import {
  ACCUMULATOR_IN_SUFFIX,
  ACCUMULATOR_OUT_SUFFIX,
  GROUP_INPUT_TYPE_ID,
  GROUP_OUTPUT_TYPE_ID,
  ITERATE_TYPE_ID,
  ITERATE_INDEX_PIN_ID,
  accumulatorInPinId,
  accumulatorOutPinId,
} from "../emit";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import type { Edge, GraphNode, NodeGraph, PinSpec, PinType } from "../types";

const ACCUM_TYPES = ["float", "vec2", "vec3", "vec4"] as const;
type AccumType = (typeof ACCUM_TYPES)[number];

const accumulatorSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCUM_TYPES),
  // `initial` is loosely typed (number | tuple) so vec accumulators can carry
  // their full default. Validated at emit time against `type`.
  initial: z.unknown().default(0),
});

export type AccumulatorSpec = z.infer<typeof accumulatorSchema>;

const config = z.object({
  count: z.number().int().min(1).max(16).default(4),
  accumulators: z.array(accumulatorSchema).default([]),
  subGraph: z.unknown(),
  label: z.string().optional(),
});

type Config = z.infer<typeof config>;

export class Iterate extends BaseNode<Config> {
  static readonly typeId = ITERATE_TYPE_ID;
  static readonly meta: NodeMeta = {
    name: "Iterate",
    category: "group",
    color: "#94a3b8",
    description: "Run a subgraph N times with feedback accumulator pins.",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const sub = this.subGraphOf(cfg);
    if (!sub) return [];
    const gi = sub.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID);
    if (!gi) return [];
    const allOutputs = readPinsConfig(gi.config);
    const accumulatorIds = new Set(
      this.cfg(cfg).accumulators.map((a) => accumulatorInPinId(a.name)),
    );
    // External inputs are everything the inner GroupInput exposes *except* the
    // accumulator-in pins and the special `index` pin (those are supplied by
    // the iterate emitter, not the parent graph).
    return allOutputs.filter((p) => p.id !== ITERATE_INDEX_PIN_ID && !accumulatorIds.has(p.id));
  }

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const accumulators = this.cfg(cfg).accumulators;
    const pins: PinSpec[] = accumulators.map((a) => ({
      id: a.name,
      type: a.type,
      label: a.name,
      default: a.initial,
    }));
    // Non-accumulator outputs from the inner GroupOutput carry through from
    // the final iteration. Less common but supported for completeness.
    const sub = this.subGraphOf(cfg);
    if (sub) {
      const go = sub.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);
      if (go) {
        const accumulatorOutIds = new Set(accumulators.map((a) => accumulatorOutPinId(a.name)));
        for (const p of readPinsConfig(go.config)) {
          if (!accumulatorOutIds.has(p.id)) pins.push(p);
        }
      }
    }
    return pins;
  }

  displayTitle(cfg: Record<string, unknown>): string {
    const c = this.cfg(cfg);
    return c.label ?? `Iterate ×${c.count}`;
  }

  emit(_ctx: EmitContext): EmitResult {
    // Real work happens in `emitIterateNode` in emit.ts — this primitive's own
    // emit is a no-op so palette previews don't crash.
    return { statements: "" };
  }

  hasSubgraph(): boolean {
    return true;
  }

  // Seed a dropped iterate node with an empty-but-navigable inner subgraph,
  // then let `syncIterateSubgraphPins` populate the canonical pin set. This
  // keeps the seed and the runtime sync as one source of truth.
  createDefaultConfig(): Record<string, unknown> {
    const base = super.createDefaultConfig();
    const subGraph: NodeGraph = {
      nodes: [
        {
          id: "gi",
          typeId: GROUP_INPUT_TYPE_ID,
          config: { pins: [] },
          position: { x: 0, y: 0 },
        },
        {
          id: "go",
          typeId: GROUP_OUTPUT_TYPE_ID,
          config: { pins: [] },
          position: { x: 400, y: 0 },
        },
      ],
      edges: [],
    };
    const cfg = { ...base, subGraph };
    syncIterateSubgraphPins({
      id: "",
      typeId: ITERATE_TYPE_ID,
      config: cfg,
      position: { x: 0, y: 0 },
    });
    return cfg;
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

// Reads `pins` from a GroupInput / GroupOutput config without importing those
// primitives (would be a circular import). Both store `pins: PinSpec[]`.
function readPinsConfig(cfg: unknown): readonly PinSpec[] {
  const pins = (cfg as { pins?: readonly PinSpec[] })?.pins;
  return Array.isArray(pins) ? pins : [];
}

export default register(Iterate);
export type { AccumType };

function defaultInitialFor(type: PinType): unknown {
  switch (type) {
    case "vec2":
      return [0, 0];
    case "vec3":
      return [0, 0, 0];
    case "vec4":
      return [0, 0, 0, 0];
    case "bool":
      return false;
    case "int":
      return 0;
    case "float":
    default:
      return 0;
  }
}

/**
 * Reconcile an iterate node's inner `GroupInput.pins` and `GroupOutput.pins`
 * against its `accumulators` config. Call this from the editor whenever the
 * user adds/removes/renames/retypes an accumulator. Pure mutation: the same
 * subgraph arrays are replaced (not edited in place) so Svelte reactivity
 * picks up the change in one tick.
 *
 * Reconciliation rules:
 *   - GroupInput keeps every non-accumulator, non-`index` pin untouched
 *     (these are external constants the user wired). Accumulator-in pins are
 *     reconciled in-place — kept and reordered if the matching accumulator
 *     still exists, added for new accumulators, dropped for deleted ones.
 *     The `index` pin is always present.
 *   - GroupOutput keeps every non-accumulator pin untouched. Accumulator-out
 *     pins are reconciled the same way.
 *   - Edges referencing dropped/retyped pins are removed. Edges referencing
 *     renamed pins are rewritten — but rename detection requires extra info
 *     (old name), so callers handle rename via an explicit rewrite before
 *     calling sync.
 */
export function syncIterateSubgraphPins(iterateNode: GraphNode): void {
  const cfg = iterateNode.config as {
    accumulators?: ReadonlyArray<AccumulatorSpec>;
    subGraph?: NodeGraph;
  };
  const accumulators = cfg.accumulators ?? [];
  const sub = cfg.subGraph;
  if (!sub || !Array.isArray(sub.nodes)) return;

  const gi = sub.nodes.find((n) => n.typeId === GROUP_INPUT_TYPE_ID);
  const go = sub.nodes.find((n) => n.typeId === GROUP_OUTPUT_TYPE_ID);
  if (!gi || !go) return;

  const accInIds = new Set(accumulators.map((a) => accumulatorInPinId(a.name)));
  const accOutIds = new Set(accumulators.map((a) => accumulatorOutPinId(a.name)));

  const giPinsExisting = readPinsConfig(gi.config);
  const giPinsExternal = giPinsExisting.filter(
    (p) => p.id !== ITERATE_INDEX_PIN_ID && !isAccumulatorPinId(p.id, ACCUMULATOR_IN_SUFFIX),
  );
  const giAccIns = accumulators.map<PinSpec>((a) => ({
    id: accumulatorInPinId(a.name),
    type: a.type,
    label:
      giPinsExisting.find((p) => p.id === accumulatorInPinId(a.name))?.label ?? `${a.name} (in)`,
    default: a.initial ?? defaultInitialFor(a.type),
  }));
  const giIndexPin: PinSpec = giPinsExisting.find((p) => p.id === ITERATE_INDEX_PIN_ID) ?? {
    id: ITERATE_INDEX_PIN_ID,
    type: "int",
    label: "Index",
    default: 0,
  };
  writePins(gi, [...giPinsExternal, ...giAccIns, giIndexPin]);

  const goPinsExisting = readPinsConfig(go.config);
  const goPinsExternal = goPinsExisting.filter(
    (p) => !isAccumulatorPinId(p.id, ACCUMULATOR_OUT_SUFFIX),
  );
  const goAccOuts = accumulators.map<PinSpec>((a) => ({
    id: accumulatorOutPinId(a.name),
    type: a.type,
    label:
      goPinsExisting.find((p) => p.id === accumulatorOutPinId(a.name))?.label ?? `${a.name} (out)`,
    default: a.initial ?? defaultInitialFor(a.type),
  }));
  writePins(go, [...goPinsExternal, ...goAccOuts]);

  const giValidIds = new Set<string>([
    ...giPinsExternal.map((p) => p.id),
    ...accInIds,
    ITERATE_INDEX_PIN_ID,
  ]);
  const goValidIds = new Set<string>([...goPinsExternal.map((p) => p.id), ...accOutIds]);
  sub.edges = sub.edges.filter((e: Edge) => {
    if (e.fromNodeId === gi.id && !giValidIds.has(e.fromPin)) return false;
    if (e.toNodeId === go.id && !goValidIds.has(e.toPin)) return false;
    return true;
  });
}

function writePins(node: GraphNode, pins: PinSpec[]): void {
  // Replace the array reference so Svelte's $state proxy ticks; an in-place
  // mutation wouldn't notify reactive consumers.
  (node.config as { pins?: PinSpec[] }).pins = pins;
}

// True for both live accumulator pins and orphan pins from deleted accumulators
// (so they get filtered out and replaced on sync). Excludes the bare suffix
// (`"_in"` / `"_out"`) which would have an empty accumulator name.
function isAccumulatorPinId(pinId: string, suffix: string): boolean {
  return pinId.endsWith(suffix) && pinId !== suffix;
}
