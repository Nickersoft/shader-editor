// Editor state for the shader composer (Svelte 5 runes class).
//
// Canonical state is a `Scene` (Figma-style tree of Layers + scene-level
// post-effects). `chain` is a $derived flat ShaderChain projection used by
// the preview / codegen paths.
//
// Scene/Layer/Node class fields are themselves `$state`, so direct mutation
// (`layer.opacity = 0.5`, `scene.layers.push(...)`) is fully reactive — no
// snapshot/clone dance required.

import { ShaderChain } from "@/shaders/core/chain";
import { EffectNode, isEffectNode, isGeneratorNode, type Node } from "@/shaders/core/node.svelte";
import { getNodeClass } from "@/shaders/core/registry";
import { Layer, Scene, chainToScene, flattenSceneToChain } from "@/shaders/core/scene.svelte";
import type { BlendMode, SerializedChain } from "@/shaders/core/types";

function fallbackSelection(scene: Scene): string | null {
  const lastLayer = scene.layers[scene.layers.length - 1];
  if (!lastLayer) return null;
  const lastFx = lastLayer.effects[lastLayer.effects.length - 1];
  return (lastFx ?? lastLayer.source).id;
}

class ComposerStore {
  scene = $state<Scene>(new Scene());
  selectedNodeId = $state<string | null>(null);
  chain = $derived(new ShaderChain(flattenSceneToChain(this.scene)));

  get selectedNode(): Node | null {
    return this.selectedNodeId ? (this.scene.findNode(this.selectedNodeId)?.node ?? null) : null;
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
    this.selectedNodeId = node.id;
  }

  removeLayer(id: string) {
    const removed = this.detachLayer(id);
    if (!removed) return;
    this.selectedNodeId = fallbackSelection(this.scene);
  }

  /**
   * Pull a layer out of wherever it lives in the tree (top-level or any
   * descendant's children list) and return it. Used by reparenting / removal
   * paths so they don't have to know whether the layer is currently a clip
   * child or a top-level layer.
   */
  private detachLayer(id: string): Layer | null {
    const idx = this.scene.layers.findIndex((l) => l.id === id);
    if (idx >= 0) return this.scene.layers.splice(idx, 1)[0];
    const walk = (parent: Layer): Layer | null => {
      const ci = parent.children.findIndex((c) => c.id === id);
      if (ci >= 0) return parent.children.splice(ci, 1)[0];
      for (const c of parent.children) {
        const found = walk(c);
        if (found) return found;
      }
      return null;
    };
    for (const l of this.scene.layers) {
      const found = walk(l);
      if (found) return found;
    }
    return null;
  }

  reorderLayers(orderedIds: string[]) {
    const byId = new Map(this.scene.layers.map((l) => [l.id, l]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter((l): l is Layer => Boolean(l));
    for (const l of this.scene.layers) if (!orderedIds.includes(l.id)) reordered.push(l);
    this.scene.layers = reordered;
  }

  /**
   * Reparent `childId` into `parentId`'s children list (clip-mask group).
   * No-op if either id is missing, or if `parentId` is a descendant of
   * `childId` (would create a cycle).
   */
  nestLayerAsChild(childId: string, parentId: string) {
    if (childId === parentId) return;
    const parent = this.scene.findLayer(parentId);
    if (!parent) return;
    // Cycle check: walk parent's ancestors and refuse if the child is one.
    const isDescendantOfChild = (l: Layer): boolean => {
      if (l.id === childId) return true;
      for (const c of l.children) if (isDescendantOfChild(c)) return true;
      return false;
    };
    if (isDescendantOfChild(parent)) return;
    const child = this.detachLayer(childId);
    if (!child) return;
    parent.children.push(child);
  }

  /** Move a layer out of any clip-group and back to the top level. */
  unnestLayer(layerId: string) {
    const layer = this.detachLayer(layerId);
    if (!layer) return;
    this.scene.layers.push(layer);
  }

  toggleLayer(id: string) {
    const layer = this.scene.findLayer(id);
    if (layer) layer.enabled = !layer.enabled;
  }

  toggleLayerMask(id: string) {
    const layer = this.scene.findLayer(id);
    if (layer) layer.useAsMask = !layer.useAsMask;
  }

  /**
   * Append a layer-scope effect. Returns the new effect's id so callers (e.g.
   * an effect picker UI) can immediately auto-open its tweak popover. Does
   * NOT change selection — under the popover model the parent layer stays
   * the selected node so the property panel doesn't lose context.
   */
  addEffectToLayer(layerId: string, effectTypeId: string): string | null {
    const cls = getNodeClass(effectTypeId);
    if (!cls) return null;
    const node = new cls();
    if (!isEffectNode(node)) return null;
    const layer = this.scene.findLayer(layerId);
    if (!layer) return null;
    layer.effects.push(node);
    // Surface the new effect via openEffectId so its popover auto-opens.
    this.openEffectId = node.id;
    return node.id;
  }

  /**
   * The effect whose tweak popover should be open in the property panel.
   * Effects-as-popovers replaces the older effect-as-selection flow; the
   * layer stays selected, while this controls which (if any) effect popover
   * is currently expanded.
   */
  openEffectId = $state<string | null>(null);

  openEffect(id: string | null) {
    this.openEffectId = id;
  }

  removeEffectFromLayer(layerId: string, effectId: string) {
    const layer = this.scene.findLayer(layerId);
    if (!layer) return;
    const idx = layer.effects.findIndex((e) => e.id === effectId);
    if (idx < 0) return;
    layer.effects.splice(idx, 1);
    if (this.selectedNodeId === effectId) this.selectedNodeId = fallbackSelection(this.scene);
    if (this.openEffectId === effectId) this.openEffectId = null;
  }

  reorderEffectsInLayer(layerId: string, orderedIds: string[]) {
    const layer = this.scene.findLayer(layerId);
    if (!layer) return;
    const byId = new Map(layer.effects.map((e) => [e.id, e]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((e): e is EffectNode => Boolean(e));
    for (const e of layer.effects) if (!orderedIds.includes(e.id)) reordered.push(e);
    layer.effects = reordered;
  }

  addSceneEffect(effectTypeId: string) {
    const cls = getNodeClass(effectTypeId);
    if (!cls) return;
    const node = new cls();
    if (!isEffectNode(node)) return;
    this.scene.postEffects.push(node);
    this.selectedNodeId = node.id;
  }

  removeSceneEffect(effectId: string) {
    const idx = this.scene.postEffects.findIndex((e) => e.id === effectId);
    if (idx < 0) return;
    this.scene.postEffects.splice(idx, 1);
    if (this.selectedNodeId === effectId) this.selectedNodeId = fallbackSelection(this.scene);
  }

  moveEffect(
    effectId: string,
    fromLayerId: string | null,
    toLayerId: string | null,
    toIndex: number,
  ) {
    const fromList =
      fromLayerId === null ? this.scene.postEffects : this.scene.findLayer(fromLayerId)?.effects;
    if (!fromList) return;
    const fromIdx = fromList.findIndex((e) => e.id === effectId);
    if (fromIdx < 0) return;
    const [node] = fromList.splice(fromIdx, 1);
    if (!node) return;
    const toList =
      toLayerId === null ? this.scene.postEffects : this.scene.findLayer(toLayerId)?.effects;
    if (!toList) {
      fromList.splice(fromIdx, 0, node);
      return;
    }
    const clamped = Math.max(0, Math.min(toIndex, toList.length));
    toList.splice(clamped, 0, node);
  }

  reorderSceneEffects(orderedIds: string[]) {
    const byId = new Map(this.scene.postEffects.map((e) => [e.id, e]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((e): e is EffectNode => Boolean(e));
    for (const e of this.scene.postEffects) if (!orderedIds.includes(e.id)) reordered.push(e);
    this.scene.postEffects = reordered;
  }

  selectNode(id: string | null) {
    this.selectedNodeId = id;
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

  // Apply several config writes as one logical mutation. Used by interactive
  // drags that move multiple correlated fields together (e.g. resize updates
  // x/y/width/height/rotation in lockstep) — sending them through this API
  // keeps the call sites declarative and makes the "atomic transform update"
  // intent legible at the source.
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

  loadChain(chain: ShaderChain) {
    this.scene = chainToScene(chain);
    this.selectedNodeId = fallbackSelection(this.scene);
  }

  loadJson(json: SerializedChain) {
    this.loadChain(ShaderChain.fromJSON(json));
  }
}

export const composer = new ComposerStore();
