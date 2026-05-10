"use client";

// Editor state for the shader composer.
//
// The canonical state is a `Scene` (Figma-style tree of Layers + scene-level
// post-effects). A derived `chain: ShaderChain` view is exposed alongside it
// so existing read paths (preview, layer-stack, codegen) keep working until
// they migrate to scene-aware accessors.

import { useMemo } from "react";
import { create } from "zustand";
import { ShaderChain } from "@/shaders/core/chain";
import {
  EffectNode,
  GeneratorNode,
  isEffectNode,
  isGeneratorNode,
  type Node,
} from "@/shaders/core/node";
import { getNodeClass } from "@/shaders/core/registry";
import { Layer, Scene, chainToScene, flattenSceneToChain } from "@/shaders/core/scene";
import type { BlendMode, SerializedChain } from "@/shaders/core/types";
import type { SerializedScene } from "@/shaders/core/scene";

interface ComposerState {
  scene: Scene;
  /** Flat ShaderChain projection of `scene` (read-only; rebuilt each change). */
  chain: ShaderChain;
  selectedNodeId: string | null;
}

interface ComposerStore extends ComposerState {
  // === Legacy flat-chain actions (kept for Phase 1 compatibility) ===
  addNode: (typeId: string) => void;
  removeNode: (id: string) => void;
  reorderNodes: (orderedIds: string[]) => void;
  selectNode: (id: string | null) => void;
  updateConfig: (nodeId: string, key: string, value: unknown) => void;
  updateInput: (nodeId: string, key: string, value: unknown) => void;
  toggleNode: (id: string) => void;
  updateBlendMode: (id: string, blendMode: BlendMode) => void;
  updateOpacity: (id: string, opacity: number) => void;
  loadChain: (chain: ShaderChain) => void;
  loadJson: (json: SerializedChain) => void;

  // === Scene-aware actions (used by the new layer-stack UI) ===
  loadScene: (scene: Scene) => void;
  loadSceneJson: (json: SerializedScene) => void;
  addLayer: (generatorTypeId: string) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (orderedIds: string[]) => void;
  toggleLayer: (id: string) => void;
  updateLayerName: (id: string, name: string) => void;
  updateLayerBlendMode: (id: string, blendMode: BlendMode) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  addEffectToLayer: (layerId: string, effectTypeId: string) => void;
  removeEffectFromLayer: (layerId: string, effectId: string) => void;
  reorderEffectsInLayer: (layerId: string, orderedIds: string[]) => void;
  addSceneEffect: (effectTypeId: string) => void;
  removeSceneEffect: (effectId: string) => void;
  reorderSceneEffects: (orderedIds: string[]) => void;
  updateSceneBackground: (color: [number, number, number, number]) => void;
}

/** Build a fresh ShaderChain projection of a Scene. */
function projectChain(scene: Scene): ShaderChain {
  return new ShaderChain(flattenSceneToChain(scene));
}

/** Force a new Scene reference so subscribers re-render. */
function snapshotScene(scene: Scene): Scene {
  const next = new Scene({
    layers: [...scene.layers],
    postEffects: [...scene.postEffects],
    background: { color: [...scene.background.color] },
  });
  return next;
}

function fallbackSelection(scene: Scene): string | null {
  const lastLayer = scene.layers[scene.layers.length - 1];
  if (!lastLayer) return null;
  const lastFx = lastLayer.effects[lastLayer.effects.length - 1];
  return (lastFx ?? lastLayer.source).id;
}

export const useComposerStore = create<ComposerStore>((set) => {
  const initialScene = new Scene();

  /** Apply a scene mutation, return updated state slice. */
  const applyScene = (
    state: ComposerState,
    scene: Scene,
    selectedNodeId?: string | null,
  ): ComposerState => ({
    scene,
    chain: projectChain(scene),
    selectedNodeId: selectedNodeId === undefined ? state.selectedNodeId : selectedNodeId,
  });

  return {
    scene: initialScene,
    chain: projectChain(initialScene),
    selectedNodeId: null,

    // ===== Legacy flat-chain actions =====

    addNode: (typeId) =>
      set((state) => {
        const cls = getNodeClass(typeId);
        if (!cls) return state;
        const node = new cls();
        const next = snapshotScene(state.scene);

        if (isGeneratorNode(node)) {
          // New Generator → new Layer at the top.
          next.layers.push(
            new Layer({
              source: node,
              blendMode: node.blendMode,
              opacity: node.opacity,
              enabled: node.enabled,
            }),
          );
          return applyScene(state, next, node.id);
        }
        if (isEffectNode(node)) {
          // Effect → attach to the topmost layer, or fall back to scene
          // post-effects if no layer yet exists.
          const top = next.layers[next.layers.length - 1];
          if (top) {
            top.effects = [...top.effects, node];
          } else {
            next.postEffects = [...next.postEffects, node];
          }
          return applyScene(state, next, node.id);
        }
        // ProcessingNode and unknown subclasses: not supported in scene model
        // for now. Fall back to legacy chain-style postEffect placement.
        return state;
      }),

    removeNode: (id) =>
      set((state) => {
        const next = removeNodeFromScene(state.scene, id);
        if (!next) return state;
        const selectedNodeId =
          state.selectedNodeId === id ? fallbackSelection(next) : state.selectedNodeId;
        return applyScene(state, next, selectedNodeId);
      }),

    reorderNodes: (orderedIds) =>
      set((state) => {
        // Re-flatten by orderedIds, then re-migrate. Effects that move past a
        // Generator will rebind to the new owning Layer.
        const flat = state.chain.nodes;
        const byId = new Map(flat.map((n) => [n.id, n]));
        const reordered = orderedIds.map((id) => byId.get(id)).filter((n): n is Node => Boolean(n));
        // Append any nodes the caller didn't include (defensive).
        for (const n of flat) if (!orderedIds.includes(n.id)) reordered.push(n);
        const reChain = new ShaderChain(reordered);
        const reScene = chainToScene(reChain);
        return applyScene(state, reScene);
      }),

    selectNode: (id) => set({ selectedNodeId: id }),

    updateConfig: (nodeId, key, value) =>
      set((state) => {
        const found = state.scene.findNode(nodeId);
        if (!found) return state;
        (found.node.config as Record<string, unknown>)[key] = value;
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateInput: (nodeId, key, value) =>
      set((state) => {
        const found = state.scene.findNode(nodeId);
        if (!found) return state;
        (found.node.inputs as Record<string, unknown>)[key] = value;
        return applyScene(state, snapshotScene(state.scene));
      }),

    toggleNode: (id) =>
      set((state) => {
        const found = state.scene.findNode(id);
        if (!found) return state;
        if (found.layer && found.node === found.layer.source) {
          // Toggling a layer's source toggles the whole layer.
          found.layer.enabled = !found.layer.enabled;
        } else {
          found.node.enabled = !found.node.enabled;
        }
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateBlendMode: (id, blendMode) =>
      set((state) => {
        const found = state.scene.findNode(id);
        if (!found) return state;
        if (found.layer && found.node === found.layer.source) {
          found.layer.blendMode = blendMode;
        }
        found.node.blendMode = blendMode;
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateOpacity: (id, opacity) =>
      set((state) => {
        const found = state.scene.findNode(id);
        if (!found) return state;
        if (found.layer && found.node === found.layer.source) {
          found.layer.opacity = opacity;
        }
        found.node.opacity = opacity;
        return applyScene(state, snapshotScene(state.scene));
      }),

    loadChain: (chain) =>
      set((state) => {
        const next = chainToScene(chain);
        return applyScene(state, next, fallbackSelection(next));
      }),

    loadJson: (json) =>
      set((state) => {
        const next = chainToScene(ShaderChain.fromJSON(json));
        return applyScene(state, next, fallbackSelection(next));
      }),

    // ===== Scene-aware actions =====

    loadScene: (scene) => set((state) => applyScene(state, scene, fallbackSelection(scene))),

    loadSceneJson: (json) =>
      set((state) => {
        const next = Scene.fromJSON(json);
        return applyScene(state, next, fallbackSelection(next));
      }),

    addLayer: (generatorTypeId) =>
      set((state) => {
        const cls = getNodeClass(generatorTypeId);
        if (!cls) return state;
        const node = new cls();
        if (!isGeneratorNode(node)) return state;
        const next = snapshotScene(state.scene);
        const layer = new Layer({
          source: node,
          blendMode: node.blendMode,
          opacity: node.opacity,
          enabled: node.enabled,
        });
        next.layers.push(layer);
        return applyScene(state, next, node.id);
      }),

    removeLayer: (id) =>
      set((state) => {
        const idx = state.scene.layers.findIndex((l) => l.id === id);
        if (idx < 0) return state;
        const next = snapshotScene(state.scene);
        next.layers.splice(idx, 1);
        return applyScene(state, next, fallbackSelection(next));
      }),

    reorderLayers: (orderedIds) =>
      set((state) => {
        const byId = new Map(state.scene.layers.map((l) => [l.id, l]));
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((l): l is Layer => Boolean(l));
        for (const l of state.scene.layers) if (!orderedIds.includes(l.id)) reordered.push(l);
        const next = snapshotScene(state.scene);
        next.layers = reordered;
        return applyScene(state, next);
      }),

    toggleLayer: (id) =>
      set((state) => {
        const layer = state.scene.findLayer(id);
        if (!layer) return state;
        layer.enabled = !layer.enabled;
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateLayerName: (id, name) =>
      set((state) => {
        const layer = state.scene.findLayer(id);
        if (!layer) return state;
        layer.name = name;
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateLayerBlendMode: (id, blendMode) =>
      set((state) => {
        const layer = state.scene.findLayer(id);
        if (!layer) return state;
        layer.blendMode = blendMode;
        return applyScene(state, snapshotScene(state.scene));
      }),

    updateLayerOpacity: (id, opacity) =>
      set((state) => {
        const layer = state.scene.findLayer(id);
        if (!layer) return state;
        layer.opacity = opacity;
        return applyScene(state, snapshotScene(state.scene));
      }),

    addEffectToLayer: (layerId, effectTypeId) =>
      set((state) => {
        const layer = state.scene.findLayer(layerId);
        if (!layer) return state;
        const cls = getNodeClass(effectTypeId);
        if (!cls) return state;
        const node = new cls();
        if (!isEffectNode(node)) return state;
        const next = snapshotScene(state.scene);
        const owned = next.findLayer(layerId);
        if (!owned) return state;
        owned.effects = [...owned.effects, node];
        return applyScene(state, next, node.id);
      }),

    removeEffectFromLayer: (layerId, effectId) =>
      set((state) => {
        const next = snapshotScene(state.scene);
        const layer = next.findLayer(layerId);
        if (!layer) return state;
        layer.effects = layer.effects.filter((e) => e.id !== effectId);
        const selectedNodeId =
          state.selectedNodeId === effectId ? fallbackSelection(next) : state.selectedNodeId;
        return applyScene(state, next, selectedNodeId);
      }),

    reorderEffectsInLayer: (layerId, orderedIds) =>
      set((state) => {
        const next = snapshotScene(state.scene);
        const layer = next.findLayer(layerId);
        if (!layer) return state;
        const byId = new Map(layer.effects.map((e) => [e.id, e]));
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((e): e is EffectNode => Boolean(e));
        for (const e of layer.effects) if (!orderedIds.includes(e.id)) reordered.push(e);
        layer.effects = reordered;
        return applyScene(state, next);
      }),

    addSceneEffect: (effectTypeId) =>
      set((state) => {
        const cls = getNodeClass(effectTypeId);
        if (!cls) return state;
        const node = new cls();
        if (!isEffectNode(node)) return state;
        const next = snapshotScene(state.scene);
        next.postEffects = [...next.postEffects, node];
        return applyScene(state, next, node.id);
      }),

    removeSceneEffect: (effectId) =>
      set((state) => {
        const next = snapshotScene(state.scene);
        next.postEffects = next.postEffects.filter((e) => e.id !== effectId);
        const selectedNodeId =
          state.selectedNodeId === effectId ? fallbackSelection(next) : state.selectedNodeId;
        return applyScene(state, next, selectedNodeId);
      }),

    reorderSceneEffects: (orderedIds) =>
      set((state) => {
        const next = snapshotScene(state.scene);
        const byId = new Map(next.postEffects.map((e) => [e.id, e]));
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((e): e is EffectNode => Boolean(e));
        for (const e of next.postEffects) if (!orderedIds.includes(e.id)) reordered.push(e);
        next.postEffects = reordered;
        return applyScene(state, next);
      }),

    updateSceneBackground: (color) =>
      set((state) => {
        const next = snapshotScene(state.scene);
        next.background = { color: [...color] };
        return applyScene(state, next);
      }),
  };
});

/** Remove any node (source, layer effect, or scene effect) by id. */
function removeNodeFromScene(scene: Scene, id: string): Scene | null {
  const next = snapshotScene(scene);
  // Drop a layer if its source matches.
  const layerIdx = next.layers.findIndex((l) => l.source.id === id);
  if (layerIdx >= 0) {
    next.layers.splice(layerIdx, 1);
    return next;
  }
  // Otherwise, scan layer effects.
  for (const layer of next.layers) {
    if (layer.effects.some((e) => e.id === id)) {
      layer.effects = layer.effects.filter((e) => e.id !== id);
      return next;
    }
  }
  // Finally, scene post-effects.
  if (next.postEffects.some((e) => e.id === id)) {
    next.postEffects = next.postEffects.filter((e) => e.id !== id);
    return next;
  }
  return null;
}

interface ComposerHookValue extends ComposerState {
  addNode: ComposerStore["addNode"];
  removeNode: ComposerStore["removeNode"];
  reorderNodes: ComposerStore["reorderNodes"];
  selectNode: ComposerStore["selectNode"];
  updateConfig: ComposerStore["updateConfig"];
  updateInput: ComposerStore["updateInput"];
  toggleNode: ComposerStore["toggleNode"];
  updateBlendMode: ComposerStore["updateBlendMode"];
  updateOpacity: ComposerStore["updateOpacity"];
  loadChain: ComposerStore["loadChain"];
  loadJson: ComposerStore["loadJson"];
  loadScene: ComposerStore["loadScene"];
  loadSceneJson: ComposerStore["loadSceneJson"];
  addLayer: ComposerStore["addLayer"];
  removeLayer: ComposerStore["removeLayer"];
  reorderLayers: ComposerStore["reorderLayers"];
  toggleLayer: ComposerStore["toggleLayer"];
  updateLayerName: ComposerStore["updateLayerName"];
  updateLayerBlendMode: ComposerStore["updateLayerBlendMode"];
  updateLayerOpacity: ComposerStore["updateLayerOpacity"];
  addEffectToLayer: ComposerStore["addEffectToLayer"];
  removeEffectFromLayer: ComposerStore["removeEffectFromLayer"];
  reorderEffectsInLayer: ComposerStore["reorderEffectsInLayer"];
  addSceneEffect: ComposerStore["addSceneEffect"];
  removeSceneEffect: ComposerStore["removeSceneEffect"];
  reorderSceneEffects: ComposerStore["reorderSceneEffects"];
  updateSceneBackground: ComposerStore["updateSceneBackground"];
  getSelectedNode: () => Node | null;
}

export function useComposer(): ComposerHookValue {
  const scene = useComposerStore((s) => s.scene);
  const chain = useComposerStore((s) => s.chain);
  const selectedNodeId = useComposerStore((s) => s.selectedNodeId);
  const addNode = useComposerStore((s) => s.addNode);
  const removeNode = useComposerStore((s) => s.removeNode);
  const reorderNodes = useComposerStore((s) => s.reorderNodes);
  const selectNode = useComposerStore((s) => s.selectNode);
  const updateConfig = useComposerStore((s) => s.updateConfig);
  const updateInput = useComposerStore((s) => s.updateInput);
  const toggleNode = useComposerStore((s) => s.toggleNode);
  const updateBlendMode = useComposerStore((s) => s.updateBlendMode);
  const updateOpacity = useComposerStore((s) => s.updateOpacity);
  const loadChain = useComposerStore((s) => s.loadChain);
  const loadJson = useComposerStore((s) => s.loadJson);
  const loadScene = useComposerStore((s) => s.loadScene);
  const loadSceneJson = useComposerStore((s) => s.loadSceneJson);
  const addLayer = useComposerStore((s) => s.addLayer);
  const removeLayer = useComposerStore((s) => s.removeLayer);
  const reorderLayers = useComposerStore((s) => s.reorderLayers);
  const toggleLayer = useComposerStore((s) => s.toggleLayer);
  const updateLayerName = useComposerStore((s) => s.updateLayerName);
  const updateLayerBlendMode = useComposerStore((s) => s.updateLayerBlendMode);
  const updateLayerOpacity = useComposerStore((s) => s.updateLayerOpacity);
  const addEffectToLayer = useComposerStore((s) => s.addEffectToLayer);
  const removeEffectFromLayer = useComposerStore((s) => s.removeEffectFromLayer);
  const reorderEffectsInLayer = useComposerStore((s) => s.reorderEffectsInLayer);
  const addSceneEffect = useComposerStore((s) => s.addSceneEffect);
  const removeSceneEffect = useComposerStore((s) => s.removeSceneEffect);
  const reorderSceneEffects = useComposerStore((s) => s.reorderSceneEffects);
  const updateSceneBackground = useComposerStore((s) => s.updateSceneBackground);

  return useMemo(
    () => ({
      scene,
      chain,
      selectedNodeId,
      addNode,
      removeNode,
      reorderNodes,
      selectNode,
      updateConfig,
      updateInput,
      toggleNode,
      updateBlendMode,
      updateOpacity,
      loadChain,
      loadJson,
      loadScene,
      loadSceneJson,
      addLayer,
      removeLayer,
      reorderLayers,
      toggleLayer,
      updateLayerName,
      updateLayerBlendMode,
      updateLayerOpacity,
      addEffectToLayer,
      removeEffectFromLayer,
      reorderEffectsInLayer,
      addSceneEffect,
      removeSceneEffect,
      reorderSceneEffects,
      updateSceneBackground,
      getSelectedNode: () =>
        selectedNodeId ? (scene.findNode(selectedNodeId)?.node ?? null) : null,
    }),
    [
      scene,
      chain,
      selectedNodeId,
      addNode,
      removeNode,
      reorderNodes,
      selectNode,
      updateConfig,
      updateInput,
      toggleNode,
      updateBlendMode,
      updateOpacity,
      loadChain,
      loadJson,
      loadScene,
      loadSceneJson,
      addLayer,
      removeLayer,
      reorderLayers,
      toggleLayer,
      updateLayerName,
      updateLayerBlendMode,
      updateLayerOpacity,
      addEffectToLayer,
      removeEffectFromLayer,
      reorderEffectsInLayer,
      addSceneEffect,
      removeSceneEffect,
      reorderSceneEffects,
      updateSceneBackground,
    ],
  );
}
