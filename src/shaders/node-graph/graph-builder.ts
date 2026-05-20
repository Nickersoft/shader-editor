// Graph-builder DSL. Authored shader graphs are sequences of `b.add(...)` /
// `b.connect(...).to(...)` calls; the builder mints unique node ids, parses
// each node's Zod config (filling defaults), and lays nodes out left-to-right
// via an internal `xCursor`. `frame()`, the polar/domain-warp helpers, and
// `colorRamp()` exist so common multi-node patterns stay one line at the
// call site.

import { GROUP_INPUT_TYPE_ID, GROUP_OUTPUT_TYPE_ID } from "./emit";
import { layoutGraph as layoutGraphWithFrames } from "./layout";
import { BaseNode, getNode } from "./registry";
import type { Edge, Frame, GraphNode, NodeGraph, PinDefault } from "./types";
import * as N from "./nodes";

const X_STEP = 220;
const Y0 = 0;

export interface GroupInputPin {
  id: string;
  type: "float" | "vec2" | "vec3" | "vec4" | "bool" | "int";
  label?: string;
  default: unknown;
}

/**
 * Typed handle returned by `add()` and the well-known helpers.
 *
 * `P` is structural-only — the runtime fields are just `nodeId` and `pin`.
 * Without the phantom field, `NodeHandle<A>` and `NodeHandle<B>` would
 * structurally collapse (both have the same shape), defeating the typed
 * `connect(handle).to(target, pin)` pin-narrowing.
 */
export class NodeHandle<P extends BaseNode = BaseNode> {
  declare readonly _phantom?: P;
  constructor(
    public readonly nodeId: string,
    public readonly pin: string = "out",
  ) {}
}

// Inferred input / output pin records from a node's `BaseNode<C, In, Out>` generics.
type InPins<P> = P extends BaseNode<infer _C, infer In, infer _O> ? In : never;
type OutPins<P> = P extends BaseNode<infer _C, infer _I, infer Out> ? Out : never;

/**
 * Pin-id literal types. When a node declares static `pins` schemas the
 * inferred records have known keys; for op-dependent nodes (Math, VectorMath)
 * the schemas are empty and `keyof` resolves to `never`. The fallback to
 * plain `string` keeps those call sites compiling without forcing every
 * dynamic-pin node to enumerate its full possible pin set.
 */
export type InPinId<P extends BaseNode> =
  keyof InPins<P> extends never ? string : keyof InPins<P> & string;
export type OutPinId<P extends BaseNode> =
  keyof OutPins<P> extends never ? string : keyof OutPins<P> & string;

/**
 * Intermediate returned by `connect(from, fromPin?)`. The `.to()` call
 * type-checks `toPin` against the target's input-pin keys.
 */
export class ConnectBuilder {
  constructor(
    private gb: GraphBuilder,
    private from: { nodeId: string; pin: string },
  ) {}

  to<To extends BaseNode>(target: NodeHandle<To>, toPin: InPinId<To>): void {
    this.gb.edges.push({
      fromNodeId: this.from.nodeId,
      fromPin: this.from.pin,
      toNodeId: target.nodeId,
      toPin: toPin as string,
    });
  }
}

export class GraphBuilder {
  nodes: GraphNode[] = [];
  edges: Edge[] = [];
  private nextId = new Map<string, number>();
  private xCursor = X_STEP;
  private giId: string | null = null;
  // Pending frame requests: nodeIds gathered while the user-supplied factory
  // ran inside `frame()`. Resolved into Frame entries at output() time, after
  // layoutGraph has assigned final positions.
  private pendingFrames: { id: string; label: string; color: string; nodeIds: string[] }[] = [];

  /**
   * Run `fn`, capturing every node it adds, and emit a Frame around them at
   * output() time. Frames nest fine — running another `frame(...)` inside the
   * factory just produces a second pending Frame whose member set is its own
   * nodes. Returns whatever `fn` returned, so call sites can keep the helper
   * shape `const ramp = b.frame("Color ramp", "...", () => b.colorRamp(...))`.
   */
  frame<T>(label: string, color: string, fn: () => T): T {
    const id = `frame_${this.pendingFrames.length + 1}`;
    const before = new Set(this.nodes.map((n) => n.id));
    const result = fn();
    const nodeIds = this.nodes.filter((n) => !before.has(n.id)).map((n) => n.id);
    if (nodeIds.length > 0) {
      this.pendingFrames.push({ id, label, color, nodeIds });
    }
    return result;
  }

  /**
   * Declare the layer's GroupInput pins. Returns a reference map so subsequent
   * `connect` calls can wire `gi.center` directly without stringly-typed lookup.
   * Each handle is untyped (`NodeHandle<BaseNode>`) since the pin set is
   * decided dynamically here; pin name autocomplete falls back to `string`.
   */
  groupInput(pins: GroupInputPin[]): Record<string, NodeHandle> {
    const id = "gi";
    this.giId = id;
    this.nodes.push({
      id,
      typeId: GROUP_INPUT_TYPE_ID,
      config: { pins: pins.map((p) => ({ ...p })) },
      position: { x: 0, y: Y0 },
    });
    const refs: Record<string, NodeHandle> = {};
    for (const p of pins) refs[p.id] = new NodeHandle(id, p.id);
    return refs;
  }

  /** Texture coordinate node — auto-placed in the second column so it's visible. */
  position(): NodeHandle<N.Position> {
    return this.addAt("texture-coordinate", {}, { x: 0, y: -160 }, "out");
  }

  /**
   * Raw screen-uv node — UV in [0,1]², matching the space the canvas
   * overlay handles operate in. Pair with the *-gradient-domain nodes
   * so their start/end/center handles align with where the user drags.
   */
  screenUv(): NodeHandle<N.ScreenUV> {
    return this.addAt("screen-uv", {}, { x: 0, y: -160 }, "uv");
  }

  time(): NodeHandle<N.Time> {
    return this.addAt("time", {}, { x: 0, y: -260 }, "out");
  }

  /**
   * Compose `p * scale + seed` and `t * speed * 0.15`. The 0.15 factor
   * matches the visual range callers expect; without it the `speed` slider
   * scrubs through animation way too fast.
   *
   * Float `seed` is broadcast to vec2 implicitly via the coercion layer
   * when it lands on `vector-math.add`'s vec2 `b` input.
   */
  fieldTransform(
    p: NodeHandle,
    t: NodeHandle,
    opts: { scale: number; speed: number; seed?: number },
  ): { p: NodeHandle; t: NodeHandle } {
    const seed = opts.seed ?? 0;

    const scaleVal = this.add(new N.Const({ value: opts.scale }));
    const scaleNode = this.add(new N.VectorMath({ op: "scale" }));
    this.connect(p).to(scaleNode, "a");
    this.connect(scaleVal).to(scaleNode, "b");

    let pOut: NodeHandle = scaleNode;
    if (seed !== 0) {
      const seedVal = this.add(new N.Const({ value: seed }));
      const addNode = this.add(new N.VectorMath({ op: "add" }));
      this.connect(scaleNode).to(addNode, "a");
      // value → vec2 coercion broadcasts `seed` to `vec2(seed)` at the edge.
      this.connect(seedVal).to(addNode, "b");
      pOut = addNode;
    }

    const speedVal = this.add(new N.Const({ value: opts.speed * 0.15 }));
    const mulNode = this.add(new N.Math({ op: "mul" }));
    this.connect(t).to(mulNode, "a");
    this.connect(speedVal).to(mulNode, "b");

    return { p: pOut, t: mulNode };
  }

  /**
   * Add a configured node to the graph.
   *
   * - `pinValues` bakes Blender-style inline defaults into unwired inputs —
   *   preferred over a dedicated Const node when the constant isn't
   *   meaningfully shared across consumers.
   * - `outPin` overrides the default returned output pin (some nodes
   *   declare a non-`out` output, e.g. `screen-uv.uv`).
   */
  add<P extends BaseNode>(
    instance: P,
    pinValues?: Record<string, PinDefault>,
    outPin?: string,
  ): NodeHandle<P> {
    return this.addAt<P>(
      instance.cls.typeId,
      instance.descriptorConfig ?? {},
      undefined,
      outPin ?? "out",
      pinValues,
    );
  }

  /**
   * Escape hatch for dynamic typeIds — exists for the single case where a
   * shader (`aurora.ts`) references a stub node that has no static class.
   * Prefer `add(new N.Foo({...}))` everywhere else; the returned handle here
   * is untyped (`NodeHandle<BaseNode>`) and pin autocomplete falls back to
   * plain `string`.
   */
  addByTypeId(
    typeId: string,
    config: Record<string, unknown> = {},
    pinValues?: Record<string, PinDefault>,
    outPin = "out",
  ): NodeHandle {
    return this.addAt(typeId, config, undefined, outPin, pinValues);
  }

  /**
   * Lower-level add used by `position()` / `time()` and the helpers that
   * need to override the auto-advance cursor or the default output pin.
   */
  private addAt<P extends BaseNode = BaseNode>(
    typeId: string,
    config: Record<string, unknown>,
    xy?: { x: number; y: number },
    outPin = "out",
    pinValues?: Record<string, PinDefault>,
  ): NodeHandle<P> {
    const id = this.mint(typeId);
    const position = xy ?? { x: this.xCursor, y: Y0 };
    if (!xy) this.xCursor += X_STEP;
    // Parse the node's config schema so unspecified keys pick up their
    // declared defaults. Otherwise `{}` would leave uniform values as
    // `undefined` and the runtime would skip binding them (rendering with
    // whatever the default uniform value happens to be — usually zero).
    const node = getNode(typeId);
    const parsed = node?.config ? (node.config.parse(config) as Record<string, unknown>) : config;
    const graphNode: GraphNode = { id, typeId, config: parsed, position };
    if (pinValues && Object.keys(pinValues).length > 0) graphNode.pinValues = { ...pinValues };
    this.nodes.push(graphNode);
    return new NodeHandle<P>(id, outPin);
  }

  /**
   * Begin an edge from `from`'s output pin (default `from.pin`, override via
   * `fromPin`). Call `.to(target, toPin)` on the returned builder to finalise.
   *
   *   b.connect(p).to(node, "p");
   *   b.connect(sep, "y").to(node, "a");
   */
  connect<F extends BaseNode>(from: NodeHandle<F>, fromPin?: OutPinId<F>): ConnectBuilder {
    const pin = (fromPin as string | undefined) ?? from.pin;
    return new ConnectBuilder(this, { nodeId: from.nodeId, pin });
  }

  /**
   * Terminate the graph. `color` wires into the GroupOutput's `color` pin;
   * `alpha`, when supplied, wires into `alpha`. Pass alpha here rather than
   * as a post-output `b.connect()` — `layoutGraph()` returns a fresh graph,
   * so any wiring done after `output()` is discarded.
   */
  output(color: NodeHandle, alpha?: NodeHandle): NodeGraph {
    const id = "go";
    this.nodes.push({
      id,
      typeId: GROUP_OUTPUT_TYPE_ID,
      config: {},
      position: { x: this.xCursor, y: Y0 },
    });
    this.edges.push({ fromNodeId: color.nodeId, fromPin: color.pin, toNodeId: id, toPin: "color" });
    if (alpha) {
      this.edges.push({ fromNodeId: alpha.nodeId, fromPin: alpha.pin, toNodeId: id, toPin: "alpha" });
    }
    const seedFrames: Frame[] = this.pendingFrames.map((pf) => ({
      id: pf.id,
      label: pf.label,
      color: pf.color,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      nodeIds: pf.nodeIds,
    }));
    const draft: NodeGraph = {
      nodes: this.nodes,
      edges: this.edges,
      ...(seedFrames.length > 0 ? { frames: seedFrames } : {}),
    };
    return layoutGraphWithFrames(draft);
  }

  /**
   * Polar transform: returns vec2 `(r, angle01)` where
   *   r       = length(p − center)
   *   angle01 = atan2(dy, dx) normalised to [0, 1]  (right-axis = 0.5)
   */
  polarTransform(p: NodeHandle, center: NodeHandle): NodeHandle {
    return this.frame("Polar transform", "#0ea5e9", () => this.polarTransformImpl(p, center));
  }

  private polarTransformImpl(p: NodeHandle, center: NodeHandle): NodeHandle {
    const d = this.add(new N.VectorMath({ op: "sub" }));
    this.connect(p).to(d, "a");
    this.connect(center).to(d, "b");
    const r = this.add(new N.VectorMath({ op: "length" }));
    this.connect(d).to(r, "a");
    const sep = this.add(new N.SeparateXy());
    this.connect(d).to(sep, "v");
    const ang = this.add(new N.Math({ op: "atan2" }));
    this.connect(sep, "y").to(ang, "a");
    this.connect(sep, "x").to(ang, "b");
    const ang01 = this.add(new N.MapRange({
      fromMin: -Math.PI,
      fromMax: Math.PI,
      toMin: 0,
      toMax: 1,
      interp: "linear",
      clamp: false,
    }));
    this.connect(ang).to(ang01, "x");
    const out = this.add(new N.CombineXy());
    this.connect(r).to(out, "x");
    this.connect(ang01).to(out, "y");
    return out;
  }

  /**
   * Polar domain: returns vec2 `(length(p)·rScale, atan2(p.y,p.x)·aScale)`.
   * Scales may be passed as a `NodeHandle` (for live wiring) or a plain number,
   * which is baked into the corresponding `math:mul` pin as a literal.
   */
  polarDomain(p: NodeHandle, rScale: NodeHandle | number, aScale: NodeHandle | number): NodeHandle {
    return this.frame("Polar domain", "#0ea5e9", () => this.polarDomainImpl(p, rScale, aScale));
  }

  private polarDomainImpl(
    p: NodeHandle,
    rScale: NodeHandle | number,
    aScale: NodeHandle | number,
  ): NodeHandle {
    const r = this.add(new N.VectorMath({ op: "length" }));
    this.connect(p).to(r, "a");
    const rs = this.add(
      new N.Math({ op: "mul" }),
      typeof rScale === "number" ? { b: rScale } : undefined,
    );
    this.connect(r).to(rs, "a");
    if (typeof rScale !== "number") this.connect(rScale).to(rs, "b");
    const sep = this.add(new N.SeparateXy());
    this.connect(p).to(sep, "v");
    const ang = this.add(new N.Math({ op: "atan2" }));
    this.connect(sep, "y").to(ang, "a");
    this.connect(sep, "x").to(ang, "b");
    const as_ = this.add(
      new N.Math({ op: "mul" }),
      typeof aScale === "number" ? { b: aScale } : undefined,
    );
    this.connect(ang).to(as_, "a");
    if (typeof aScale !== "number") this.connect(aScale).to(as_, "b");
    const out = this.add(new N.CombineXy());
    this.connect(rs).to(out, "x");
    this.connect(as_).to(out, "y");
    return out;
  }

  /**
   * fBm-driven domain warp on `p`. The fbm output is in [0,1]; we recenter to
   * [-1, 1] so the offset is signed.
   */
  domainWarp(
    p: NodeHandle,
    t: NodeHandle,
    cfg: { scale: number; amplitude: number; detail: number; timePhase: number },
  ): NodeHandle {
    return this.frame("Domain warp", "#8b5cf6", () => this.domainWarpImpl(p, t, cfg));
  }

  private domainWarpImpl(
    p: NodeHandle,
    t: NodeHandle,
    cfg: { scale: number; amplitude: number; detail: number; timePhase: number },
  ): NodeHandle {
    const wp = this.add(new N.VectorMath({ op: "scale" }), { b: cfg.scale });
    this.connect(p).to(wp, "a");

    const wt = this.add(new N.Math({ op: "mul" }), { b: cfg.timePhase });
    this.connect(t).to(wt, "a");

    const offX = this.add(new N.CombineXy(), { y: 0 });
    this.connect(wt).to(offX, "x");
    const uvX = this.add(new N.VectorMath({ op: "add" }));
    this.connect(wp).to(uvX, "a");
    this.connect(offX).to(uvX, "b");

    const offY = this.add(new N.CombineXy(), { x: 0 });
    this.connect(wt).to(offY, "y");
    const uvY = this.add(new N.VectorMath({ op: "add" }));
    this.connect(wp).to(uvY, "a");
    this.connect(offY).to(uvY, "b");

    const noiseCfg = {
      kind: "fbm" as const,
      scale: 1,
      detail: cfg.detail,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    };
    const nX = this.add(new N.NoiseTexture(noiseCfg), { t: 0 });
    this.connect(uvX).to(nX, "p");
    const nY = this.add(new N.NoiseTexture(noiseCfg), { t: 0 });
    this.connect(uvY).to(nY, "p");

    // fbm output is [0,1]; recenter to [-1,1] so the warp offset is signed.
    const nXs = this.add(new N.Math({ op: "mul" }), { b: 2 });
    this.connect(nX).to(nXs, "a");
    const nXc = this.add(new N.Math({ op: "sub" }), { b: 1 });
    this.connect(nXs).to(nXc, "a");
    const nYs = this.add(new N.Math({ op: "mul" }), { b: 2 });
    this.connect(nY).to(nYs, "a");
    const nYc = this.add(new N.Math({ op: "sub" }), { b: 1 });
    this.connect(nYs).to(nYc, "a");

    const offsetV = this.add(new N.CombineXy());
    this.connect(nXc).to(offsetV, "x");
    this.connect(nYc).to(offsetV, "y");
    const offsetScaled = this.add(new N.VectorMath({ op: "scale" }), { b: cfg.amplitude });
    this.connect(offsetV).to(offsetScaled, "a");

    const out = this.add(new N.VectorMath({ op: "add" }));
    this.connect(p).to(out, "a");
    this.connect(offsetScaled).to(out, "b");
    return out;
  }

  /** Standard "two-stop colour ramp" pattern. */
  colorRamp(t: NodeHandle, colors: readonly (readonly [number, number, number])[]): NodeHandle {
    if (colors.length < 2) throw new Error("ColorRamp needs at least 2 stops");
    const stops = colors.map((c, i) => ({
      position: i / (colors.length - 1),
      color: c as [number, number, number],
    }));
    const ref = this.add(new N.ColorRamp({ stops }));
    this.connect(t).to(ref, "t");
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
