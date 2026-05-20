// Scene-aware pass planner. Walks a Scene tree and produces a flat
// `PassPlan[]` consumed by `buildFragment` + the runtime.
//
// Render order:
//   for each enabled Layer (bottom → top):
//     splitIntoPasses(layer.source, ...layer.effects)
//     mark the LAST pass with commitToLayer = layerIndex
//   compositor pass (mode='compositor', bindLayerTextures=true)
//   for each scene post-effect: an Effect pass (readsPrevPass)
//
// The compositor pass synthesizes a virtual Effect that emits a fragment
// shader sampling N layer textures by name (`u_layer_0..u_layer_{N-1}`) and
// blending them via each layer's blendMode + opacity.

import type { Scene, Layer } from "@/shaders/core/scene.svelte";
import { effectNeedsBackdrop, type ShaderClass } from "@/shaders/core/shader.svelte";
import type { PassPlan } from "./passes";
import { splitIntoPasses } from "./passes";

export interface ScenePlan {
  /** All passes flattened in render order. */
  passes: PassPlan[];
  /** One entry per enabled layer in render order — bound to layer textures. */
  layers: Array<{
    layer: Layer;
    layerIndex: number;
    /** Index of the clipping parent in this `layers` array, or null. */
    parentIndex: number | null;
    /** Indices into `passes` that belong to this layer (in render order). */
    passIndices: number[];
  }>;
  /** Index in `passes` of the synthesized compositor pass, or -1 if 0 layers. */
  compositorPassIndex: number;
  /** Indices of scene post-effect passes in render order. */
  postEffectPassIndices: number[];
}

export function planScene(scene: Scene): ScenePlan {
  const passes: PassPlan[] = [];
  const layerEntries: ScenePlan["layers"] = [];
  const flat = scene.flatLayers();

  // Map a layer's flatIndex (from Scene.flatLayers) to its slot in
  // `layerEntries` once allocated. A layer that produces no passes (e.g. its
  // source is disabled) is skipped entirely; any descendants that referenced
  // it as their clip parent fall back to un-clipped.
  const flatIndexToEntryIndex = new Map<number, number>();

  // 1. Layer mini-chains.
  for (const flatLayer of flat) {
    const { layer } = flatLayer;
    if (!layer.source.enabled) continue;
    const layerNodes = [layer.source, ...layer.effects.filter((e) => e.enabled)];
    const layerPasses = splitIntoPasses(layerNodes);
    if (layerPasses.length === 0) continue;

    const entryIndex = layerEntries.length;
    // Mark the final pass to commit into this layer's texture slot.
    const last = layerPasses[layerPasses.length - 1];
    last.commitToLayer = entryIndex;

    // If any node in this layer's chain is a backdrop-aware Effect, prepend
    // a backdrop compositor pass that blends only the layers already
    // committed (`entryIndex` of them) into the dedicated backdrop FBO.
    // Tag every pass in the mini-chain as readsBackdrop so the runtime
    // binds u_backdrop on each — at minimum the effect's pass needs it,
    // and tagging the whole chain is safe (the runtime no-ops the bind if
    // the program never references the uniform).
    const needsBackdrop = layerNodes.some((n) => effectNeedsBackdrop(n.constructor as ShaderClass));
    if (needsBackdrop) {
      // Even at entryIndex 0 we still emit the backdrop pass — the compositor
      // produces the scene background alone, which is the correct backdrop
      // when nothing sits below this layer.
      passes.push({
        nodes: [],
        readsPrevPass: false,
        mode: "backdrop",
        bindLayerTextures: true,
        layerCountForBackdrop: entryIndex,
      });
      for (const p of layerPasses) p.readsBackdrop = true;
    }

    const startIndex = passes.length;
    passes.push(...layerPasses);
    const parentIndex =
      flatLayer.parentFlatIndex !== null
        ? (flatIndexToEntryIndex.get(flatLayer.parentFlatIndex) ?? null)
        : null;
    layerEntries.push({
      layer,
      layerIndex: entryIndex,
      parentIndex,
      passIndices: layerPasses.map((_, j) => startIndex + j),
    });
    flatIndexToEntryIndex.set(flatLayer.flatIndex, entryIndex);
  }

  // 2. Compositor pass (only when at least one layer rendered).
  let compositorPassIndex = -1;
  if (layerEntries.length > 0) {
    const compositorPlan: PassPlan = {
      nodes: [],
      readsPrevPass: false,
      mode: "compositor",
      bindLayerTextures: true,
    };
    compositorPassIndex = passes.length;
    passes.push(compositorPlan);
  }

  // 3. Scene post-effects. Each EffectNode emits one or more passes; first
  //    block reads the compositor output via u_prevPass.
  const postEffectPassIndices: number[] = [];
  for (const fx of scene.postEffects) {
    if (!fx.enabled) continue;
    const fxPasses = splitIntoPasses([fx]);
    for (const p of fxPasses) {
      postEffectPassIndices.push(passes.length);
      passes.push(p);
    }
  }

  return {
    passes,
    layers: layerEntries,
    compositorPassIndex,
    postEffectPassIndices,
  };
}
