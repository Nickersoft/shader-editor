// Tiny graph-builder DSL for preset files. The aim is to keep each preset
// definition close to its old stage-chain shape (a list of primitives) without
// hand-writing edge arrays. The builder maintains the previous-output cursor
// (`prev`) plus a position cursor so authored presets get an automatic
// left-to-right layout.

import { getPrimitive, GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID } from "@/shaders/node-graph";
import type { Edge, GraphNode, NodeGraph } from "@/shaders/node-graph";

const X_STEP = 220;
const Y0 = 0;

export interface GroupInputPin {
  id: string;
  type: "float" | "vec2" | "vec3" | "vec4" | "bool" | "int";
  label?: string;
  default: unknown;
}

export interface PrevRef {
  nodeId: string;
  pin: string;
}

export class PresetGraphBuilder {
  nodes: GraphNode[] = [];
  edges: Edge[] = [];
  private nextId = new Map<string, number>();
  private xCursor = X_STEP;
  private giId: string | null = null;

  /**
   * Declare the layer's GroupInput pins. Returns a reference map so subsequent
   * `connect` calls can wire `gi.center` directly without stringly-typed lookup.
   */
  groupInput(pins: GroupInputPin[]): Record<string, PrevRef> {
    const id = "gi";
    this.giId = id;
    this.nodes.push({
      id,
      typeId: GROUP_INPUT_TYPE_ID,
      config: { pins: pins.map((p) => ({ ...p })) },
      position: { x: 0, y: Y0 },
    });
    const refs: Record<string, PrevRef> = {};
    for (const p of pins) refs[p.id] = { nodeId: id, pin: p.id };
    return refs;
  }

  /** Position primitive — auto-placed in the second column so it's visible. */
  position(): PrevRef {
    return this.add("position", {}, { x: 0, y: -160 }, "out");
  }

  time(): PrevRef {
    return this.add("time", {}, { x: 0, y: -260 }, "out");
  }

  /**
   * Add a primitive node. `xy` overrides the auto-advance cursor; omit for
   * the default left-to-right flow. Returns a `PrevRef` to the named output
   * pin (defaults to `"out"`).
   */
  add(
    typeId: string,
    config: Record<string, unknown>,
    xy?: { x: number; y: number },
    outPin = "out",
  ): PrevRef {
    const id = this.mint(typeId);
    const position = xy ?? { x: this.xCursor, y: Y0 };
    if (!xy) this.xCursor += X_STEP;
    // Parse the primitive's config schema so unspecified keys pick up their
    // declared defaults. Otherwise `{}` would leave uniform values as
    // `undefined` and the runtime would skip binding them (rendering with
    // whatever the default uniform value happens to be — usually zero).
    const prim = getPrimitive(typeId);
    const parsed = prim?.config ? (prim.config.parse(config) as Record<string, unknown>) : config;
    this.nodes.push({ id, typeId, config: parsed, position });
    return { nodeId: id, pin: outPin };
  }

  /** Connect a `PrevRef` (or literal node+pin pair) to a target node's input pin. */
  connect(from: PrevRef, toNodeId: string, toPin: string) {
    this.edges.push({
      fromNodeId: from.nodeId,
      fromPin: from.pin,
      toNodeId,
      toPin,
    });
  }

  /** Convenience: connect into the most recently added node's named pin. */
  connectInto(from: PrevRef, toPin: string) {
    const last = this.nodes[this.nodes.length - 1];
    if (!last) throw new Error("connectInto called before any node was added");
    this.connect(from, last.id, toPin);
  }

  /**
   * Terminate the graph: places a GroupOutput at the cursor and wires the
   * given color reference into its single input.
   */
  output(color: PrevRef): NodeGraph {
    const id = "go";
    this.nodes.push({
      id,
      typeId: GROUP_OUTPUT_TYPE_ID,
      config: {},
      position: { x: this.xCursor, y: Y0 },
    });
    this.edges.push({ fromNodeId: color.nodeId, fromPin: color.pin, toNodeId: id, toPin: "color" });
    return { nodes: this.nodes, edges: this.edges };
  }

  /** Standard "two-stop colour ramp" pattern. */
  colorRamp(t: PrevRef, colors: readonly (readonly [number, number, number])[]): PrevRef {
    if (colors.length < 2) throw new Error("ColorRamp needs at least 2 stops");
    const stops = colors.map((c, i) => ({
      position: i / (colors.length - 1),
      color: c as [number, number, number],
    }));
    const ref = this.add("color-ramp", { stops });
    this.connect(t, ref.nodeId, "t");
    return ref;
  }

  /** Reference to the (single) GroupInput by id — for the rare wiring case. */
  get groupInputId(): string {
    if (!this.giId) throw new Error("groupInput() must be called first");
    return this.giId;
  }

  private mint(typeId: string): string {
    const n = (this.nextId.get(typeId) ?? 0) + 1;
    this.nextId.set(typeId, n);
    return `${typeId}_${n}`;
  }
}
