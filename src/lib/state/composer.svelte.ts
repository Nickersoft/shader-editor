// Editor state for the shader composer (Svelte 5 runes class).
//
// Canonical state is a `Scene` (Figma-style tree of Layers + scene-level
// post-effects). Scene/Layer/Node class fields are themselves `$state`, so
// direct mutation (`layer.opacity = 0.5`, `scene.layers.push(...)`) is fully
// reactive — no snapshot/clone dance required.

import { reorderById } from "@/lib/utils";
import { Layer } from "@/shaders/core/layer.svelte";
import { EffectNode, isEffectNode, isGeneratorNode, type Node } from "@/shaders/core/node.svelte";
import { getNodeClass } from "@/shaders/core/registry";
import { Scene } from "@/shaders/core/scene.svelte";
import type { BlendMode } from "@/shaders/core/types";

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
}

export const composer = new ComposerStore();
