// Editor state for the shader composer (Svelte 5 runes class).
//
// Canonical state is a `Scene` (Figma-style tree of Layers + scene-level
// post-effects). Scene/Layer/Shader class fields are themselves `$state`, so
// direct mutation (`layer.opacity = 0.5`, `scene.layers.push(...)`) is fully
// reactive — no snapshot/clone dance required.

import { makeId, reorderById } from "@/lib/utils";
import { Layer } from "@/shaders/core/layer.svelte";
import {
  isProceduralShader,
  type ProceduralShader,
} from "@/shaders/core/procedural-shader.svelte";
import { getShaderClass } from "@/shaders/core/registry";
import { Scene } from "@/shaders/core/scene.svelte";
import { Effect, isEffect, isGenerator, type Shader } from "@/shaders/core/shader.svelte";
import type { BlendMode } from "@/shaders/core/types";
import {
  getPrimitive,
  GROUP_TYPE_ID,
  makeGroup as makeGroupOp,
  ungroup as ungroupOp,
  type Edge,
  type Frame,
  type GraphNode,
  type NodeGraph,
  type PinDefault,
  type PinType,
} from "@/shaders/node-graph";
import { layoutGraph } from "@/shaders/node-graph/layout";

function fallbackSelection(scene: Scene): string | null {
  const lastLayer = scene.layers[scene.layers.length - 1];
  if (!lastLayer) return null;
  const lastFx = lastLayer.effects[lastLayer.effects.length - 1];
  return (lastFx ?? lastLayer.source).id;
}

class ComposerStore {
  scene = $state<Scene>(new Scene());
  selectedNodeId = $state<string | null>(null);
  // Mutually exclusive with `selectedNodeId`: when true, the Scene root is
  // active and its background / post-effects render in the property panel.
  isSceneSelected = $state<boolean>(false);
  openEffectId = $state<string | null>(null);
  // When set, the texture-graph editor's bottom sheet is mounted for this layer.
  editingTextureLayerId = $state<string | null>(null);
  /**
   * Path of group-node ids descended from the editing layer's root graph to
   * the subgraph the user is currently viewing. Empty array == root. Reset
   * whenever the editor opens or closes. Tab pushes; Shift+Tab pops.
   */
  graphEditStack = $state<string[]>([]);

  get selectedNode(): Shader | null {
    return this.selectedNodeId ? (this.scene.findShader(this.selectedNodeId)?.shader ?? null) : null;
  }

  // Resolves an effect list by owner: `null` → scene-level post-effects;
  // otherwise the named layer's effects array (or undefined if missing).
  private effectList(layerId: string | null): Effect[] | undefined {
    return layerId === null ? this.scene.postEffects : this.scene.findLayer(layerId)?.effects;
  }

  addLayer(generatorTypeId: string) {
    const cls = getShaderClass(generatorTypeId);
    if (!cls) return;
    const node = new cls();
    if (!isGenerator(node)) return;
    this.scene.layers.push(
      new Layer({
        source: node,
        blendMode: node.blendMode,
        opacity: node.opacity,
        enabled: node.enabled,
      }),
    );
    this.selectNode(node.id);
  }

  removeLayer(id: string) {
    const removed = this.scene.detachLayer(id);
    if (!removed) return;
    this.selectNode(fallbackSelection(this.scene));
  }

  reorderLayers(orderedIds: string[]) {
    this.scene.layers = reorderById(this.scene.layers, orderedIds);
  }

  /**
   * Reparent `childId` into `parentId`'s children list (clip-mask group).
   * No-op if either id is missing or would create a cycle.
   */
  nestLayerAsChild(childId: string, parentId: string) {
    this.moveLayerRelativeTo(childId, parentId, "nest");
  }

  /** Move a layer out of any clip-group and back to the top level. */
  unnestLayer(layerId: string) {
    const layer = this.scene.detachLayer(layerId);
    if (!layer) return;
    this.scene.layers.push(layer);
  }

  /**
   * Drop-on-row dispatcher driving the layer panel's drag-and-drop. Detaches
   * `sourceId` and re-inserts it relative to `targetId`:
   *   - 'nest': as the last child of target (Figma-style "clip into shape")
   *   - 'before' / 'after': as a sibling of target in target's parent list,
   *     in storage order (the panel display is reversed before this is called)
   * No-ops on cycle, missing ids, or self-drop.
   */
  moveLayerRelativeTo(sourceId: string, targetId: string, mode: "before" | "after" | "nest") {
    if (sourceId === targetId) return;
    const target = this.scene.findLayer(targetId);
    if (!target) return;

    if (mode === "nest") {
      if (this.scene.isDescendant(sourceId, targetId)) return;
      const source = this.scene.detachLayer(sourceId);
      if (!source) return;
      target.children.push(source);
      return;
    }

    const targetParent = this.scene.findLayerParent(targetId);
    if (targetParent === undefined) return;
    if (targetParent && this.scene.isDescendant(sourceId, targetParent.id)) return;
    const source = this.scene.detachLayer(sourceId);
    if (!source) return;
    const list = targetParent === null ? this.scene.layers : targetParent.children;
    // Re-find target index: detachLayer may have shifted indices when source
    // was a sibling of target in the same list.
    const idx = list.findIndex((l) => l.id === targetId);
    if (idx < 0) {
      this.scene.layers.push(source);
      return;
    }
    list.splice(mode === "before" ? idx : idx + 1, 0, source);
  }

  toggleLayer(id: string) {
    const layer = this.scene.findLayer(id);
    if (layer) layer.enabled = !layer.enabled;
  }

  /**
   * Append an effect to a layer (`layerId`) or to the scene (`null`). Returns
   * the new effect's id; auto-opens its tweak popover. Selection is not
   * changed — the parent layer/scene stays selected so the property panel
   * keeps its context.
   */
  private addEffect(layerId: string | null, effectTypeId: string): string | null {
    const cls = getShaderClass(effectTypeId);
    if (!cls) return null;
    const node = new cls();
    if (!isEffect(node)) return null;
    const list = this.effectList(layerId);
    if (!list) return null;
    list.push(node);
    this.openEffectId = node.id;
    return node.id;
  }

  private removeEffect(layerId: string | null, effectId: string) {
    const list = this.effectList(layerId);
    if (!list) return;
    const idx = list.findIndex((e) => e.id === effectId);
    if (idx < 0) return;
    list.splice(idx, 1);
    if (this.selectedNodeId === effectId) this.selectNode(fallbackSelection(this.scene));
    if (this.openEffectId === effectId) this.openEffectId = null;
  }

  addEffectToLayer(layerId: string, effectTypeId: string): string | null {
    return this.addEffect(layerId, effectTypeId);
  }

  removeEffectFromLayer(layerId: string, effectId: string) {
    this.removeEffect(layerId, effectId);
  }

  addSceneEffect(effectTypeId: string): string | null {
    return this.addEffect(null, effectTypeId);
  }

  removeSceneEffect(effectId: string) {
    this.removeEffect(null, effectId);
  }

  reorderEffectsInLayer(layerId: string, orderedIds: string[]) {
    const layer = this.scene.findLayer(layerId);
    if (!layer) return;
    layer.effects = reorderById(layer.effects, orderedIds);
  }

  reorderSceneEffects(orderedIds: string[]) {
    this.scene.postEffects = reorderById(this.scene.postEffects, orderedIds);
  }

  openEffect(id: string | null) {
    this.openEffectId = id;
  }

  moveEffect(
    effectId: string,
    fromLayerId: string | null,
    toLayerId: string | null,
    toIndex: number,
  ) {
    const fromList = this.effectList(fromLayerId);
    if (!fromList) return;
    const fromIdx = fromList.findIndex((e) => e.id === effectId);
    if (fromIdx < 0) return;
    const [node] = fromList.splice(fromIdx, 1);
    if (!node) return;
    const toList = this.effectList(toLayerId);
    if (!toList) {
      fromList.splice(fromIdx, 0, node);
      return;
    }
    const clamped = Math.max(0, Math.min(toIndex, toList.length));
    toList.splice(clamped, 0, node);
  }

  selectNode(id: string | null) {
    this.selectedNodeId = id;
    if (id !== null) this.isSceneSelected = false;
  }

  selectScene() {
    this.selectedNodeId = null;
    this.isSceneSelected = true;
  }

  updateSceneBackground(color: [number, number, number, number]) {
    this.scene.background = { color };
  }

  toggleNode(id: string) {
    const found = this.scene.findShader(id);
    if (!found) return;
    if (found.layer && found.shader === found.layer.source) {
      found.layer.enabled = !found.layer.enabled;
    } else {
      found.shader.enabled = !found.shader.enabled;
    }
  }

  /** Write one input field on a shader. */
  updateInput(nodeId: string, key: string, value: unknown) {
    const found = this.scene.findShader(nodeId);
    if (!found) return;
    (found.shader.inputs as Record<string, unknown>)[key] = value;
  }

  /**
   * Apply several input writes as one logical mutation. Used by interactive
   * drags that move correlated fields in lockstep (e.g. resize updates
   * x/y/width/height/rotation together).
   */
  updateInputBatch(nodeId: string, updates: Record<string, unknown>) {
    const found = this.scene.findShader(nodeId);
    if (!found) return;
    const bag = found.shader.inputs as Record<string, unknown>;
    for (const key in updates) bag[key] = updates[key];
  }

  /**
   * Write a single field on one of a ProceduralShader's graph nodes. Used by
   * canvas-overlay handles that address primitive-owned spatial fields (e.g.
   * the `start`/`end` config of a linear-gradient-domain primitive) instead
   * of layer-level inputs.
   */
  updateGraphNodeConfig(
    sourceId: string,
    graphNodeId: string,
    key: string,
    value: unknown,
  ) {
    const node = this.findGraphNode(sourceId, graphNodeId);
    if (!node) return;
    (node.config as Record<string, unknown>)[key] = value;
  }

  /** Batch variant of `updateGraphNodeConfig`. */
  updateGraphNodeConfigBatch(
    sourceId: string,
    graphNodeId: string,
    updates: Record<string, unknown>,
  ) {
    const node = this.findGraphNode(sourceId, graphNodeId);
    if (!node) return;
    const cfg = node.config as Record<string, unknown>;
    for (const key in updates) cfg[key] = updates[key];
  }

  private findGraphNode(sourceId: string, graphNodeId: string): GraphNode | null {
    const found = this.scene.findShader(sourceId);
    if (!found) return null;
    const source = found.shader;
    if (!isProceduralShader(source)) return null;
    return source.graph.nodes.find((n) => n.id === graphNodeId) ?? null;
  }

  /**
   * Locate a ProceduralShader source by layer id and return it, or `null` if
   * the layer or source isn't one. Used by the graph-manipulation helpers.
   */
  private findFieldGroup(layerId: string): ProceduralShader | null {
    const layer = this.scene.findLayer(layerId);
    const src = layer?.source;
    return src && isProceduralShader(src) ? src : null;
  }

  /**
   * Walk `graphEditStack` from the field's root graph down through each
   * group node's `config.subGraph`. Returns the actively-edited graph (or
   * the root, when the stack is empty). If any stack entry has drifted from
   * reality (group renamed/removed, subGraph cleared), the stack is silently
   * reset and the root is returned so the editor doesn't strand the user.
   *
   * This is the single source of truth for "which graph do mutations target";
   * every graph-editing method below resolves through it.
   */
  activeGraphFor(layerId: string): NodeGraph | null {
    const field = this.findFieldGroup(layerId);
    if (!field) return null;
    let graph: NodeGraph = field.graph;
    for (const nodeId of this.graphEditStack) {
      const node = graph.nodes.find((n) => n.id === nodeId);
      const sub = node && (node.config as { subGraph?: NodeGraph }).subGraph;
      if (!sub) {
        this.graphEditStack = [];
        return field.graph;
      }
      graph = sub;
    }
    return graph;
  }

  /**
   * Push a group node onto the edit stack. The Tab key calls this with the
   * currently-selected node id; nothing happens if the id doesn't resolve to
   * a group on the active graph.
   */
  enterGraphGroup(nodeId: string) {
    const layerId = this.editingTextureLayerId;
    if (!layerId) return;
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node || node.typeId !== GROUP_TYPE_ID) return;
    this.graphEditStack = [...this.graphEditStack, nodeId];
    // Clear selection so the inner Group Input doesn't appear pre-selected.
    this.selectedNodeId = null;
  }

  /** Pop one level off the edit stack. No-op at root. */
  exitGraphGroup() {
    if (this.graphEditStack.length === 0) return;
    this.graphEditStack = this.graphEditStack.slice(0, -1);
    this.selectedNodeId = null;
  }

  /** Jump to a specific depth (0 == root). Used by the breadcrumb. */
  navigateGraphToDepth(depth: number) {
    if (depth < 0 || depth >= this.graphEditStack.length) return;
    this.graphEditStack = this.graphEditStack.slice(0, depth);
    this.selectedNodeId = null;
  }

  /**
   * Breadcrumb entries from root → current. `nodeId` is null for the root
   * step; depth is the position users would pass to `navigateGraphToDepth`.
   */
  graphBreadcrumb(): readonly { nodeId: string | null; label: string; depth: number }[] {
    const layerId = this.editingTextureLayerId;
    if (!layerId) return [];
    const field = this.findFieldGroup(layerId);
    if (!field) return [];
    const out: { nodeId: string | null; label: string; depth: number }[] = [
      { nodeId: null, label: "Root", depth: 0 },
    ];
    let graph: NodeGraph = field.graph;
    for (let i = 0; i < this.graphEditStack.length; i++) {
      const id = this.graphEditStack[i];
      const node = graph.nodes.find((n) => n.id === id);
      if (!node) break;
      const cfg = node.config as { label?: string; subGraph?: NodeGraph };
      out.push({ nodeId: id, label: cfg.label || "Group", depth: i + 1 });
      if (!cfg.subGraph) break;
      graph = cfg.subGraph;
    }
    return out;
  }

  updateBlendMode(id: string, blendMode: BlendMode) {
    const found = this.scene.findShader(id);
    if (!found) return;
    if (found.layer && found.shader === found.layer.source) found.layer.blendMode = blendMode;
    found.shader.blendMode = blendMode;
  }

  updateOpacity(id: string, opacity: number) {
    const found = this.scene.findShader(id);
    if (!found) return;
    if (found.layer && found.shader === found.layer.source) found.layer.opacity = opacity;
    found.shader.opacity = opacity;
  }

  loadScene(scene: Scene) {
    this.scene = scene;
    this.selectNode(fallbackSelection(this.scene));
  }

  openTextureEditor(layerId: string) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    this.editingTextureLayerId = layerId;
    this.graphEditStack = [];
    this.selectNode(group.id);
  }

  closeTextureEditor() {
    this.editingTextureLayerId = null;
    this.graphEditStack = [];
  }

  // ==========================================================================
  // Node-graph manipulation. Operates on the `graph: NodeGraph` field of a
  // ProceduralShader source.

  addGraphNode(layerId: string, typeId: string, position?: { x: number; y: number }) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return null;
    const prim = getPrimitive(typeId);
    if (!prim) return null;
    // Parse `{}` against the primitive's config schema so all defaults populate.
    const parsed = (prim.config ? prim.config.parse({}) : {}) as Record<string, unknown>;
    const id = makeId(typeId);
    graph.nodes.push({
      id,
      typeId,
      config: parsed,
      position: position ?? { x: 0, y: 0 },
    });
    return id;
  }

  removeGraphNode(layerId: string, nodeId: string) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    // GroupInput / GroupOutput are structural — refuse to delete the only one.
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.typeId === "group-input" || node.typeId === "group-output") {
      const count = graph.nodes.filter((n) => n.typeId === node.typeId).length;
      if (count <= 1) return;
    }
    graph.nodes = graph.nodes.filter((n) => n.id !== nodeId);
    graph.edges = graph.edges.filter(
      (e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId,
    );
  }

  connectGraphEdge(
    layerId: string,
    edge: { fromNodeId: string; fromPin: string; toNodeId: string; toPin: string },
  ) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    if (edge.fromNodeId === edge.toNodeId) return;
    this.coerceRerouteTypes(graph, edge);
    // One incoming wire per target pin — replace any existing edge to that pin.
    const filtered = graph.edges.filter(
      (e) => !(e.toNodeId === edge.toNodeId && e.toPin === edge.toPin),
    );
    filtered.push({ ...edge });
    graph.edges = filtered;
  }

  /**
   * Reroutes carry their pin type in `config.pinType`; that type starts as
   * `float` but should adopt whatever the user wires through them. Two cases:
   *
   *   1. Connection TO a reroute's `in` — clamp pinType to the source's type
   *      (the source is committed; the reroute follows). Any downstream edges
   *      whose target pin type no longer matches are dropped.
   *   2. Connection FROM a reroute's `out` — only flex when the reroute is
   *      "free" (no incoming edge AND no other outgoing edges). Flex it to the
   *      target's type so the user can wire from a reroute first.
   *
   * Reroute chains (a reroute connected to another reroute) propagate via the
   * same rules — when the upstream end mutates, the downstream reroute's
   * incoming-edge handler fires later, since each user action is one edge.
   */
  private coerceRerouteTypes(
    graph: { nodes: GraphNode[]; edges: Edge[] },
    edge: { fromNodeId: string; fromPin: string; toNodeId: string; toPin: string },
  ) {
    const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
    const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);

    if (toNode?.typeId === "reroute" && fromNode) {
      const t = pinTypeOf(fromNode, edge.fromPin, "output");
      if (t) setReroutePinType(graph, toNode, t);
      return;
    }
    if (fromNode?.typeId === "reroute" && toNode) {
      const incoming = graph.edges.find((e) => e.toNodeId === fromNode.id);
      const otherOutgoing = graph.edges.some(
        (e) => e.fromNodeId === fromNode.id && !(e.toNodeId === edge.toNodeId && e.toPin === edge.toPin),
      );
      if (!incoming && !otherOutgoing) {
        const t = pinTypeOf(toNode, edge.toPin, "input");
        if (t) setReroutePinType(graph, fromNode, t);
      }
    }
  }

  disconnectGraphEdge(layerId: string, target: { toNodeId: string; toPin: string }) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    graph.edges = graph.edges.filter(
      (e) => !(e.toNodeId === target.toNodeId && e.toPin === target.toPin),
    );
  }

  setGraphNodePosition(layerId: string, nodeId: string, position: { x: number; y: number }) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.position = position;
  }

  /**
   * Set a single field on a graph node's config. Used by the inline node
   * editor — Blender-style per-node controls render their own NumberInput /
   * Select and call back here on commit.
   */
  setGraphNodeConfig(layerId: string, nodeId: string, key: string, value: unknown) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    (node.config as Record<string, unknown>)[key] = value;
  }

  /**
   * Set (or clear, with `undefined`) the inline override value for a single
   * input pin on a graph node. Reads at runtime via the promoted internal
   * uniform's `originalPath`, so the new value lands in the next frame
   * without rebuilding the shader.
   */
  setGraphNodePinValue(
    layerId: string,
    nodeId: string,
    pinId: string,
    value: PinDefault | undefined,
  ) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (value === undefined) {
      if (node.pinValues) delete node.pinValues[pinId];
      return;
    }
    (node.pinValues ??= {})[pinId] = value;
  }

  /**
   * Re-run the layered auto-layout against the layer's graph. Mutates each
   * node's `position` in place rather than replacing the graph reference, so
   * the structural fingerprint stays identical and no shader rebuild fires.
   */
  relayoutGraph(layerId: string) {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return;
    const laid = layoutGraph(graph);
    const nodePosById = new Map(laid.nodes.map((n) => [n.id, n.position] as const));
    for (const node of graph.nodes) {
      const p = nodePosById.get(node.id);
      if (p) node.position = p;
    }
    // Cluster-aware layout also resizes/repositions framed clusters; mirror
    // that into composer state so the editor reflects the new layout.
    if (laid.frames && graph.frames) {
      const frameById = new Map(laid.frames.map((f) => [f.id, f] as const));
      for (const f of graph.frames) {
        const next = frameById.get(f.id);
        if (!next) continue;
        f.position = { ...next.position };
        f.size = { ...next.size };
      }
    }
  }

  // ==========================================================================
  // Frames — non-emit visual groupings stored on `graph.frames`. They render
  // behind nodes and are pure metadata; no ordering or selection semantics
  // beyond what xyflow gives us out of the box.

  private framesOf(layerId: string): Frame[] | null {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return null;
    if (!graph.frames) graph.frames = [];
    return graph.frames;
  }

  addFrame(
    layerId: string,
    init?: { position?: { x: number; y: number }; size?: { width: number; height: number }; label?: string; color?: string },
  ): string | null {
    const frames = this.framesOf(layerId);
    if (!frames) return null;
    const id = makeId("frame");
    frames.push({
      id,
      label: init?.label ?? "Group",
      position: init?.position ?? { x: 0, y: 0 },
      size: init?.size ?? { width: 320, height: 220 },
      // Slate-300 by default — neutral enough that any content reads on top.
      color: init?.color ?? "#94a3b8",
    });
    return id;
  }

  removeFrame(layerId: string, frameId: string) {
    const frames = this.framesOf(layerId);
    if (!frames) return;
    const next = frames.filter((f) => f.id !== frameId);
    const graph = this.activeGraphFor(layerId);
    if (graph) graph.frames = next;
  }

  setFramePosition(layerId: string, frameId: string, position: { x: number; y: number }) {
    const frames = this.framesOf(layerId);
    if (!frames) return;
    const frame = frames.find((f) => f.id === frameId);
    if (frame) frame.position = position;
  }

  setFrameSize(layerId: string, frameId: string, size: { width: number; height: number }) {
    const frames = this.framesOf(layerId);
    if (!frames) return;
    const frame = frames.find((f) => f.id === frameId);
    if (frame) frame.size = size;
  }

  setFrameLabel(layerId: string, frameId: string, label: string) {
    const frames = this.framesOf(layerId);
    if (!frames) return;
    const frame = frames.find((f) => f.id === frameId);
    if (frame) frame.label = label;
  }

  setFrameColor(layerId: string, frameId: string, color: string) {
    const frames = this.framesOf(layerId);
    if (!frames) return;
    const frame = frames.find((f) => f.id === frameId);
    if (frame) frame.color = color;
  }

  /**
   * Wrap the given selection of nodes into a new group node. Returns the new
   * group's id (or null if the selection is invalid). The composer applies
   * the operation in place on the active graph; if a successful group is
   * created, selection follows it.
   */
  makeGroupFromSelection(layerId: string, selectedNodeIds: readonly string[]): string | null {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return null;
    const newId = makeGroupOp(graph, selectedNodeIds);
    if (newId) this.selectNode(newId);
    return newId;
  }

  /**
   * Inverse of `makeGroupFromSelection`. Splices the group's subGraph back
   * into the active graph; returns the ids of the surfaced child nodes (or
   * null if `nodeId` is not a group on the active graph).
   */
  ungroupNode(layerId: string, nodeId: string): readonly string[] | null {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return null;
    const surfaced = ungroupOp(graph, nodeId);
    if (surfaced && surfaced.length > 0) this.selectNode(surfaced[0]);
    return surfaced;
  }

  duplicateGraphNode(layerId: string, nodeId: string): string | null {
    const graph = this.activeGraphFor(layerId);
    if (!graph) return null;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    // group-input / group-output are structural singletons.
    if (node.typeId === "group-input" || node.typeId === "group-output") return null;
    const newId = makeId(node.typeId);
    graph.nodes.push({
      id: newId,
      typeId: node.typeId,
      config: structuredClone(node.config),
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    });
    return newId;
  }
}

export const composer = new ComposerStore();

function pinTypeOf(node: GraphNode, pinId: string, side: "input" | "output"): PinType | null {
  const prim = getPrimitive(node.typeId);
  if (!prim) return null;
  const pins = side === "input" ? prim.inputs(node.config) : prim.outputs(node.config);
  return pins.find((p) => p.id === pinId)?.type ?? null;
}

/**
 * Mutate a reroute's `config.pinType` and prune any downstream edges whose
 * target pin no longer matches the new type. Inbound edges to the reroute
 * are left alone — the caller is the one handing us the new type, either
 * from the source they're connecting now or via their own constraints.
 */
function setReroutePinType(
  graph: { nodes: GraphNode[]; edges: Edge[] },
  reroute: GraphNode,
  type: PinType,
) {
  const cfg = reroute.config as Record<string, unknown>;
  if (cfg.pinType === type) return;
  cfg.pinType = type;
  graph.edges = graph.edges.filter((e) => {
    if (e.fromNodeId !== reroute.id) return true;
    const target = graph.nodes.find((n) => n.id === e.toNodeId);
    if (!target) return false;
    // Reroute downstream of a reroute: cascade-coerce instead of dropping.
    if (target.typeId === "reroute") {
      setReroutePinType(graph, target, type);
      return true;
    }
    return pinTypeOf(target, e.toPin, "input") === type;
  });
}
