// Tiny graph-builder DSL for preset files. The aim is to keep each preset
// definition close to its old stage-chain shape (a list of primitives) without
// hand-writing edge arrays. The builder maintains the previous-output cursor
// (`prev`) plus a position cursor so authored presets get an automatic
// left-to-right layout.

import {
  getPrimitive,
  GROUP_INPUT_TYPE_ID,
  GROUP_OUTPUT_TYPE_ID,
  layoutGraph as layoutGraphWithFrames,
} from "@/shaders/node-graph";
import type {
  Edge,
  Frame,
  GraphNode,
  NodeGraph,
  PinDefault,
} from "@/shaders/node-graph";

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

  /** Texture coordinate primitive — auto-placed in the second column so it's visible. */
  position(): PrevRef {
    return this.addAt("texture-coordinate", {}, { x: 0, y: -160 }, "out");
  }

  /**
   * Raw screen-uv primitive — UV in [0,1]², matching the space the canvas
   * overlay handles operate in. Pair with the *-gradient-domain primitives
   * so their start/end/center handles align with where the user drags.
   */
  screenUv(): PrevRef {
    return this.addAt("screen-uv", {}, { x: 0, y: -160 }, "uv");
  }

  time(): PrevRef {
    return this.addAt("time", {}, { x: 0, y: -260 }, "out");
  }

  /**
   * Compose the position-and-time transform that the retired `field-source`
   * primitive used to perform in one node — `p * scale + seed`, `t * speed
   * * 0.15`. Built out of atomic primitives (vector-math, math, value) so
   * every node does at most one job. The `0.15` legacy magic constant is
   * folded into the speed value here, eliminating a hidden coefficient
   * from the runtime.
   *
   * Float `seed` is broadcast to vec2 implicitly via the coercion layer
   * when it lands on `vector-math.add`'s vec2 `b` input.
   */
  fieldTransform(
    p: PrevRef,
    t: PrevRef,
    opts: { scale: number; speed: number; seed?: number },
  ): { p: PrevRef; t: PrevRef } {
    const seed = opts.seed ?? 0;

    const scaleVal = this.add("value", { value: opts.scale });
    const scaleNode = this.add("vector-math", { op: "scale" });
    this.connect(p, scaleNode.nodeId, "a");
    this.connect(scaleVal, scaleNode.nodeId, "b");

    let pOut: PrevRef = scaleNode;
    if (seed !== 0) {
      const seedVal = this.add("value", { value: seed });
      const addNode = this.add("vector-math", { op: "add" });
      this.connect(scaleNode, addNode.nodeId, "a");
      // value → vec2 coercion broadcasts `seed` to `vec2(seed)` at the edge.
      this.connect(seedVal, addNode.nodeId, "b");
      pOut = addNode;
    }

    const speedVal = this.add("value", { value: opts.speed * 0.15 });
    const mulNode = this.add("math", { op: "mul" });
    this.connect(t, mulNode.nodeId, "a");
    this.connect(speedVal, mulNode.nodeId, "b");

    return { p: pOut, t: mulNode };
  }

  /**
   * Add a primitive node.
   *
   * - `pinValues` bakes Blender-style inline defaults into unwired inputs —
   *   preferred over a dedicated Value node when the constant isn't
   *   meaningfully shared across consumers.
   * - `outPin` overrides the default returned output pin (some primitives
   *   declare a non-`out` output, e.g. `screen-uv.uv`).
   */
  add(
    typeId: string,
    config: Record<string, unknown>,
    pinValues?: Record<string, PinDefault>,
    outPin = "out",
  ): PrevRef {
    return this.addAt(typeId, config, undefined, outPin, pinValues);
  }

  /**
   * Lower-level add used by `position()` / `time()` and the helpers that
   * need to override the auto-advance cursor or the default output pin.
   */
  private addAt(
    typeId: string,
    config: Record<string, unknown>,
    xy?: { x: number; y: number },
    outPin = "out",
    pinValues?: Record<string, PinDefault>,
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
    const node: GraphNode = { id, typeId, config: parsed, position };
    if (pinValues && Object.keys(pinValues).length > 0) node.pinValues = { ...pinValues };
    this.nodes.push(node);
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
   * given color reference into its single input, then runs the layered
   * auto-layout so authored presets land in tidy left-to-right columns
   * regardless of the order `add` was called in.
   */
  /**
   * Terminate the graph. `color` wires into the GroupOutput's `color` pin;
   * `alpha`, when supplied, wires into the `alpha` pin. Pass alpha here
   * rather than as a post-output `b.connect()` — the new layout pass returns
   * a fresh edges array, so any wiring done after `output()` returns is lost.
   */
  output(color: PrevRef, alpha?: PrevRef): NodeGraph {
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
    // Hand layoutGraph the frames-with-members so the cluster-aware pass can
    // run. layoutGraph populates final position+size on every frame from the
    // sub-laid bbox of its members; the placeholder values here are ignored.
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
    const result = layoutGraphWithFrames(draft);
    return result;
  }

  /**
   * Polar transform: returns vec2 `(r, angle01)` where
   *   r       = length(p − center)
   *   angle01 = atan2(dy, dx) normalised to [0, 1]  (right-axis = 0.5)
   *
   * Compose of: vector-math:sub → vector-math:length, separate-xy → math:atan2
   * → map-range[-π,π → 0,1] → combine-xy. Replacement for the retired
   * `polar-transform` primitive — keeps the call-site terse while the saved
   * graph contains only Blender-class primitives.
   */
  polarTransform(p: PrevRef, center: PrevRef): PrevRef {
    return this.frame("Polar transform", "#0ea5e9", () => this.polarTransformImpl(p, center));
  }

  private polarTransformImpl(p: PrevRef, center: PrevRef): PrevRef {
    const d = this.add("vector-math", { op: "sub" });
    this.connect(p, d.nodeId, "a");
    this.connect(center, d.nodeId, "b");
    const r = this.add("vector-math", { op: "length" });
    this.connect(d, r.nodeId, "a");
    const sep = this.add("separate-xy", {});
    this.connect(d, sep.nodeId, "v");
    const ang = this.add("math", { op: "atan2" });
    this.connect({ nodeId: sep.nodeId, pin: "y" }, ang.nodeId, "a");
    this.connect({ nodeId: sep.nodeId, pin: "x" }, ang.nodeId, "b");
    const ang01 = this.add("map-range", {
      fromMin: -Math.PI,
      fromMax: Math.PI,
      toMin: 0,
      toMax: 1,
      interp: "linear",
      clamp: false,
    });
    this.connect(ang, ang01.nodeId, "x");
    const out = this.add("combine-xy", {});
    this.connect(r, out.nodeId, "x");
    this.connect(ang01, out.nodeId, "y");
    return out;
  }

  /**
   * Polar domain: returns vec2 `(length(p)·rScale, atan2(p.y,p.x)·aScale)`.
   * Replaces the retired `polar-domain` primitive with primitive ops. Scales
   * may be passed as a `PrevRef` (for live wiring) or a plain number, which
   * is baked into the corresponding `math:mul` pin as a literal.
   */
  polarDomain(p: PrevRef, rScale: PrevRef | number, aScale: PrevRef | number): PrevRef {
    return this.frame("Polar domain", "#0ea5e9", () => this.polarDomainImpl(p, rScale, aScale));
  }

  private polarDomainImpl(
    p: PrevRef,
    rScale: PrevRef | number,
    aScale: PrevRef | number,
  ): PrevRef {
    const r = this.add("vector-math", { op: "length" });
    this.connect(p, r.nodeId, "a");
    const rs = this.add(
      "math",
      { op: "mul" },
      typeof rScale === "number" ? { b: rScale } : undefined,
    );
    this.connect(r, rs.nodeId, "a");
    if (typeof rScale !== "number") this.connect(rScale, rs.nodeId, "b");
    const sep = this.add("separate-xy", {});
    this.connect(p, sep.nodeId, "v");
    const ang = this.add("math", { op: "atan2" });
    this.connect({ nodeId: sep.nodeId, pin: "y" }, ang.nodeId, "a");
    this.connect({ nodeId: sep.nodeId, pin: "x" }, ang.nodeId, "b");
    const as_ = this.add(
      "math",
      { op: "mul" },
      typeof aScale === "number" ? { b: aScale } : undefined,
    );
    this.connect(ang, as_.nodeId, "a");
    if (typeof aScale !== "number") this.connect(aScale, as_.nodeId, "b");
    const out = this.add("combine-xy", {});
    this.connect(rs, out.nodeId, "x");
    this.connect(as_, out.nodeId, "y");
    return out;
  }

  /**
   * fBm-driven domain warp on `p`: returns `p + amplitude · vec2(fbm(p·scale +
   * vec2(t·timePhase,0)), fbm(p·scale + vec2(0,t·timePhase)))`. Replaces the
   * retired `domain-warp` primitive with two `noise-texture` (fbm) samples and
   * primitive vector ops. The fbm output is in [0,1]; we recenter to [-1, 1]
   * so the offset is signed, matching the legacy behaviour.
   */
  domainWarp(
    p: PrevRef,
    t: PrevRef,
    cfg: { scale: number; amplitude: number; detail: number; timePhase: number },
  ): PrevRef {
    return this.frame("Domain warp", "#8b5cf6", () => this.domainWarpImpl(p, t, cfg));
  }

  private domainWarpImpl(
    p: PrevRef,
    t: PrevRef,
    cfg: { scale: number; amplitude: number; detail: number; timePhase: number },
  ): PrevRef {
    // wp = p * cfg.scale
    const wp = this.add("vector-math", { op: "scale" }, { b: cfg.scale });
    this.connect(p, wp.nodeId, "a");

    // wt = t * cfg.timePhase
    const wt = this.add("math", { op: "mul" }, { b: cfg.timePhase });
    this.connect(t, wt.nodeId, "a");

    // x-offset uv: wp + vec2(wt, 0)
    const offX = this.add("combine-xy", {}, { y: 0 });
    this.connect(wt, offX.nodeId, "x");
    const uvX = this.add("vector-math", { op: "add" });
    this.connect(wp, uvX.nodeId, "a");
    this.connect(offX, uvX.nodeId, "b");

    // y-offset uv: wp + vec2(0, wt)
    const offY = this.add("combine-xy", {}, { x: 0 });
    this.connect(wt, offY.nodeId, "y");
    const uvY = this.add("vector-math", { op: "add" });
    this.connect(wp, uvY.nodeId, "a");
    this.connect(offY, uvY.nodeId, "b");

    const noiseCfg = {
      kind: "fbm" as const,
      scale: 1,
      detail: cfg.detail,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    };
    const nX = this.add("noise-texture", noiseCfg, { t: 0 });
    this.connect(uvX, nX.nodeId, "p");
    const nY = this.add("noise-texture", noiseCfg, { t: 0 });
    this.connect(uvY, nY.nodeId, "p");

    // [0,1] → [-1,1]: n·2 − 1
    const nXs = this.add("math", { op: "mul" }, { b: 2 });
    this.connect(nX, nXs.nodeId, "a");
    const nXc = this.add("math", { op: "sub" }, { b: 1 });
    this.connect(nXs, nXc.nodeId, "a");
    const nYs = this.add("math", { op: "mul" }, { b: 2 });
    this.connect(nY, nYs.nodeId, "a");
    const nYc = this.add("math", { op: "sub" }, { b: 1 });
    this.connect(nYs, nYc.nodeId, "a");

    // offset = vec2(nXc, nYc) * cfg.amplitude
    const offsetV = this.add("combine-xy", {});
    this.connect(nXc, offsetV.nodeId, "x");
    this.connect(nYc, offsetV.nodeId, "y");
    const offsetScaled = this.add("vector-math", { op: "scale" }, { b: cfg.amplitude });
    this.connect(offsetV, offsetScaled.nodeId, "a");

    // out = p + offsetScaled
    const out = this.add("vector-math", { op: "add" });
    this.connect(p, out.nodeId, "a");
    this.connect(offsetScaled, out.nodeId, "b");
    return out;
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
