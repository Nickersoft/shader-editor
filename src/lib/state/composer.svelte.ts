// Editor state for the shader composer (Svelte 5 runes class).
//
// Canonical state is a `Scene` (Figma-style tree of Layers + scene-level
// post-effects). Scene/Layer/Node class fields are themselves `$state`, so
// direct mutation (`layer.opacity = 0.5`, `scene.layers.push(...)`) is fully
// reactive — no snapshot/clone dance required.

import { makeId, reorderById } from "@/lib/utils";
import { Layer } from "@/shaders/core/layer.svelte";
import { EffectNode, isEffectNode, isGeneratorNode, type Node } from "@/shaders/core/node.svelte";
import {
  isFieldStageNode,
  isFieldStageNodeClass,
} from "@/shaders/core/node.svelte";
import { getNodeClass } from "@/shaders/core/registry";
import { Scene } from "@/shaders/core/scene.svelte";
import type { BlendMode } from "@/shaders/core/types";
import { ProceduralField } from "@/shaders/textures/procedural-field.svelte";
import { getProceduralPreset } from "@/shaders/textures/procedural-presets";
import { getPrimitive } from "@/shaders/node-graph";

export type StageEdgeSpec = { fromStageId: string; toStageId: string; toPort: string };
export type StageEdgeTarget = { toStageId: string; toPort: string };

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
  // Texture-graph stage selection — intentionally separate from
  // `selectedNodeId` so picking a stage in the graph doesn't reshape the main
  // property panel (which keeps showing the owning layer's properties).
  selectedStageId = $state<string | null>(null);

  get selectedNode(): Node | null {
    return this.selectedNodeId ? (this.scene.findNode(this.selectedNodeId)?.node ?? null) : null;
  }

  // Resolves an effect list by owner: `null` → scene-level post-effects;
  // otherwise the named layer's effects array (or undefined if missing).
  private effectList(layerId: string | null): EffectNode[] | undefined {
    return layerId === null ? this.scene.postEffects : this.scene.findLayer(layerId)?.effects;
  }

  addLayer(generatorTypeId: string) {
    const cls = getNodeClass(generatorTypeId);
    if (!cls) return;
    const node = new cls();
    if (!isGeneratorNode(node)) return;
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

  /**
   * Preset edges are declared by stage *index* — IDs are minted fresh on each
   * instantiation, so we materialize the stage list with stable IDs first,
   * then translate index pairs into `(fromStageId, toStageId, toPort)` triples.
   */
  addProceduralPresetLayer(presetId: string) {
    const cls = getNodeClass("procedural-field");
    if (!cls) return;
    const preset = getProceduralPreset(presetId);
    if (!preset) return;

    const stages = preset.stages().map((entry) => ({
      ...entry,
      id: entry.id ?? makeId(entry.typeId),
    }));
    const presetEdges = preset.edges?.() ?? [];
    const edges = presetEdges
      .map((e) => {
        const from = stages[e.fromIndex];
        const to = stages[e.toIndex];
        if (!from || !to) return null;
        return { fromStageId: from.id!, toStageId: to.id!, toPort: e.toPort };
      })
      .filter((e): e is { fromStageId: string; toStageId: string; toPort: string } => e !== null);

    const node = new cls({
      config: { presetId: preset.id, stages, edges },
    });
    if (!isGeneratorNode(node)) return;
    this.scene.layers.push(
      new Layer({
        source: node,
        name: preset.name,
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
    const cls = getNodeClass(effectTypeId);
    if (!cls) return null;
    const node = new cls();
    if (!isEffectNode(node)) return null;
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
    const found = this.scene.findNode(id);
    if (!found) return;
    if (found.layer && found.node === found.layer.source) {
      found.layer.enabled = !found.layer.enabled;
    } else {
      found.node.enabled = !found.node.enabled;
    }
  }

  updateConfig(nodeId: string, key: string, value: unknown) {
    const found = this.scene.findNode(nodeId);
    if (!found) return;
    (found.node.config as Record<string, unknown>)[key] = value;
  }

  /**
   * Apply several config writes as one logical mutation. Used by interactive
   * drags that move correlated fields in lockstep (e.g. resize updates
   * x/y/width/height/rotation together).
   */
  updateConfigBatch(nodeId: string, updates: Record<string, unknown>) {
    const found = this.scene.findNode(nodeId);
    if (!found) return;
    const cfg = found.node.config as Record<string, unknown>;
    for (const key in updates) cfg[key] = updates[key];
  }

  updateInput(nodeId: string, key: string, value: unknown) {
    const found = this.scene.findNode(nodeId);
    if (!found) return;
    (found.node.inputs as Record<string, unknown>)[key] = value;
  }

  /**
   * Locate a ProceduralField by id and return it, or `null` if the layer or
   * source isn't one. Used by the stage-manipulation helpers below.
   */
  private findFieldGroup(layerId: string): ProceduralField | null {
    const layer = this.scene.findLayer(layerId);
    const src = layer?.source;
    return src instanceof ProceduralField ? src : null;
  }

  /**
   * Append a new stage to a ProceduralField's chain. Stage chain shape change
   * triggers a shader rebuild via the container's structuralKey.
   */
  addStageToFieldGroup(layerId: string, stageTypeId: string): string | null {
    const group = this.findFieldGroup(layerId);
    if (!group) return null;
    const cls = getNodeClass(stageTypeId);
    if (!cls || !isFieldStageNodeClass(cls)) return null;
    const stage = new cls();
    if (!isFieldStageNode(stage)) return null;
    group.stages.push(stage);
    // Adding a stage detaches the layer from any named preset — the chain no
    // longer matches the preset definition.
    if (group.config.presetId) {
      group.config.presetId = null;
      const owner = this.scene.findLayer(layerId);
      if (owner) owner.name = group.meta.name;
    }
    this.selectNode(stage.id);
    return stage.id;
  }

  /** Remove a stage from a ProceduralField's chain by id. */
  removeStage(stageId: string) {
    const found = this.scene.findNode(stageId);
    const layer = found?.layer;
    if (!layer) return;
    const group = layer.source instanceof ProceduralField ? layer.source : null;
    if (!group) return;
    const idx = group.stages.findIndex((s) => s.id === stageId);
    if (idx < 0) return;
    group.stages.splice(idx, 1);
    // Drop any aux edges that reference this stage — keeping them would
    // leave the codegen pointing at a non-existent captured local.
    const touchesRemoved = group.edges.some(
      (e) => e.fromStageId === stageId || e.toStageId === stageId,
    );
    if (touchesRemoved) {
      group.edges = group.edges.filter(
        (e) => e.fromStageId !== stageId && e.toStageId !== stageId,
      );
    }
    if (group.config.presetId) {
      group.config.presetId = null;
      layer.name = group.meta.name;
    }
    if (this.selectedNodeId === stageId) this.selectNode(group.id);
  }

  /** Reorder stages within a ProceduralField. `orderedIds` is full target order. */
  reorderStages(layerId: string, orderedIds: string[]) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    group.stages = reorderById(group.stages, orderedIds);
    if (group.config.presetId) {
      group.config.presetId = null;
      const owner = this.scene.findLayer(layerId);
      if (owner) owner.name = group.meta.name;
    }
  }

  /**
   * Move a stage to occupy the slot of `targetStageId` inside the same
   * ProceduralField. Both stages must live in the same container — cross-group
   * stage moves are intentionally rejected because stages aren't standalone.
   */
  moveStageRelativeTo(sourceStageId: string, targetStageId: string) {
    if (sourceStageId === targetStageId) return;
    const srcInfo = this.scene.findNode(sourceStageId);
    const tgtInfo = this.scene.findNode(targetStageId);
    const layer = srcInfo?.layer;
    if (!layer || tgtInfo?.layer !== layer) return;
    const group = layer.source instanceof ProceduralField ? layer.source : null;
    if (!group) return;
    const srcIdx = group.stages.findIndex((s) => s.id === sourceStageId);
    const tgtIdx = group.stages.findIndex((s) => s.id === targetStageId);
    if (srcIdx < 0 || tgtIdx < 0) return;
    const [moved] = group.stages.splice(srcIdx, 1);
    group.stages.splice(tgtIdx, 0, moved);
    if (group.config.presetId) {
      group.config.presetId = null;
      layer.name = group.meta.name;
    }
  }

  /**
   * Forward references (aux input pointing to a later stage) would emit GLSL
   * referencing an undeclared local — refuse them outright. One wire per
   * port: an existing edge on the same target port is replaced.
   */
  connectStageEdge(layerId: string, edge: StageEdgeSpec) {
    const { fromStageId, toStageId, toPort } = edge;
    if (fromStageId === toStageId) return;
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    const fromIdx = group.stages.findIndex((s) => s.id === fromStageId);
    const toIdx = group.stages.findIndex((s) => s.id === toStageId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= toIdx) return;
    const existing = group.edges.find(
      (e) => e.toStageId === toStageId && e.toPort === toPort,
    );
    if (existing && existing.fromStageId === fromStageId) return;
    const filtered = group.edges.filter(
      (e) => !(e.toStageId === toStageId && e.toPort === toPort),
    );
    filtered.push({ fromStageId, toStageId, toPort });
    group.edges = filtered;
  }

  disconnectStageEdge(layerId: string, target: StageEdgeTarget) {
    const { toStageId, toPort } = target;
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    const hasMatch = group.edges.some(
      (e) => e.toStageId === toStageId && e.toPort === toPort,
    );
    if (!hasMatch) return;
    group.edges = group.edges.filter(
      (e) => !(e.toStageId === toStageId && e.toPort === toPort),
    );
  }

  /**
   * Detach a Procedural Field layer from its named preset. The chain is kept
   * intact (no shader rebuild) but the layer is renamed to the generic name
   * and `presetId` is cleared so future edits can't snap back to the preset.
   * One-way; there's no re-group counterpart by design.
   */
  separateProceduralPreset(layerId: string) {
    const layer = this.scene.findLayer(layerId);
    if (!layer) return;
    const source = layer.source;
    if (source.typeId !== "procedural-field") return;
    const cfg = source.config as { presetId?: string | null };
    if (!cfg.presetId) return;
    cfg.presetId = null;
    layer.name = source.meta.name;
  }

  updateBlendMode(id: string, blendMode: BlendMode) {
    const found = this.scene.findNode(id);
    if (!found) return;
    if (found.layer && found.node === found.layer.source) found.layer.blendMode = blendMode;
    found.node.blendMode = blendMode;
  }

  updateOpacity(id: string, opacity: number) {
    const found = this.scene.findNode(id);
    if (!found) return;
    if (found.layer && found.node === found.layer.source) found.layer.opacity = opacity;
    found.node.opacity = opacity;
  }

  loadScene(scene: Scene) {
    this.scene = scene;
    this.selectNode(fallbackSelection(this.scene));
  }

  openTextureEditor(layerId: string) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    this.editingTextureLayerId = layerId;
    // Keep the owning generator selected in the outer panel — with the
    // texture graph mounted as a bottom sheet (not a full-screen takeover),
    // the layer is still visible above, so it should stay the active context.
    this.selectNode(group.id);
    this.selectedStageId = null;
  }

  closeTextureEditor() {
    this.editingTextureLayerId = null;
    this.selectedStageId = null;
  }

  selectStage(id: string | null) {
    this.selectedStageId = id;
  }

  // ==========================================================================
  // Node-graph manipulation. Operates on the new `graph: NodeGraph` field of
  // ProceduralField. Phase 3 will remove the old stage-* methods above.

  addGraphNode(layerId: string, typeId: string, position?: { x: number; y: number }) {
    const group = this.findFieldGroup(layerId);
    if (!group) return null;
    const prim = getPrimitive(typeId);
    if (!prim) return null;
    // Parse `{}` against the primitive's config schema so all defaults populate.
    const parsed = (prim.config ? prim.config.parse({}) : {}) as Record<string, unknown>;
    const id = makeId(typeId);
    group.graph.nodes.push({
      id,
      typeId,
      config: parsed,
      position: position ?? { x: 0, y: 0 },
    });
    return id;
  }

  removeGraphNode(layerId: string, nodeId: string) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    // GroupInput / GroupOutput are structural — refuse to delete the only one.
    const node = group.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.typeId === "group-input" || node.typeId === "group-output") {
      const count = group.graph.nodes.filter((n) => n.typeId === node.typeId).length;
      if (count <= 1) return;
    }
    group.graph.nodes = group.graph.nodes.filter((n) => n.id !== nodeId);
    group.graph.edges = group.graph.edges.filter(
      (e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId,
    );
  }

  connectGraphEdge(
    layerId: string,
    edge: { fromNodeId: string; fromPin: string; toNodeId: string; toPin: string },
  ) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    if (edge.fromNodeId === edge.toNodeId) return;
    // One incoming wire per target pin — replace any existing edge to that pin.
    const filtered = group.graph.edges.filter(
      (e) => !(e.toNodeId === edge.toNodeId && e.toPin === edge.toPin),
    );
    filtered.push({ ...edge });
    group.graph.edges = filtered;
  }

  disconnectGraphEdge(layerId: string, target: { toNodeId: string; toPin: string }) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    group.graph.edges = group.graph.edges.filter(
      (e) => !(e.toNodeId === target.toNodeId && e.toPin === target.toPin),
    );
  }

  setGraphNodePosition(layerId: string, nodeId: string, position: { x: number; y: number }) {
    const group = this.findFieldGroup(layerId);
    if (!group) return;
    const node = group.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    node.position = position;
  }
}

export const composer = new ComposerStore();
