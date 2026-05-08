// Scene-aware pass planner. Walks a Scene tree and produces a flat
// `PassPlan[]` consumed by `buildFragment` + the runtime.
//
// Render order:
//   for each enabled Layer (bottom → top):
//     splitIntoPasses(layer.source, ...layer.effects)
//     mark the LAST pass with commitToLayer = layerIndex
//   compositor pass (mode='compositor', bindLayerTextures=true)
//   for each scene post-effect: an EffectNode pass (readsPrevPass)
//
// The compositor pass synthesizes a virtual EffectNode that emits a fragment
// shader sampling N layer textures by name (`u_layer_0..u_layer_{N-1}`) and
// blending them via each layer's blendMode + opacity.

import type { Scene, Layer } from '@/shaders/core/scene'
import type { PassPlan } from './passes'
import { splitIntoPasses } from './passes'

export interface ScenePlan {
  /** All passes flattened in render order. */
  passes: PassPlan[]
  /** One entry per enabled layer in render order — bound to layer textures. */
  layers: Array<{
    layer: Layer
    layerIndex: number
    /** Indices into `passes` that belong to this layer (in render order). */
    passIndices: number[]
  }>
  /** Index in `passes` of the synthesized compositor pass, or -1 if 0 layers. */
  compositorPassIndex: number
  /** Indices of scene post-effect passes in render order. */
  postEffectPassIndices: number[]
}

export function planScene(scene: Scene): ScenePlan {
  const passes: PassPlan[] = []
  const layerEntries: ScenePlan['layers'] = []
  const enabledLayers = scene.enabledLayers

  // 1. Layer mini-chains.
  for (let i = 0; i < enabledLayers.length; i++) {
    const layer = enabledLayers[i]
    if (!layer.source.enabled) continue
    const layerNodes = [layer.source, ...layer.effects.filter((e) => e.enabled)]
    const layerPasses = splitIntoPasses(layerNodes)
    if (layerPasses.length === 0) continue

    // Mark the final pass to commit into this layer's texture slot.
    const last = layerPasses[layerPasses.length - 1]
    last.commitToLayer = i

    const startIndex = passes.length
    passes.push(...layerPasses)
    layerEntries.push({
      layer,
      layerIndex: i,
      passIndices: layerPasses.map((_, j) => startIndex + j),
    })
  }

  // 2. Compositor pass (only when at least one layer rendered).
  let compositorPassIndex = -1
  if (layerEntries.length > 0) {
    const compositorPlan: PassPlan = {
      nodes: [],
      readsPrevPass: false,
      mode: 'compositor',
      bindLayerTextures: true,
    }
    compositorPassIndex = passes.length
    passes.push(compositorPlan)
  }

  // 3. Scene post-effects. Each EffectNode emits one or more passes; first
  //    block reads the compositor output via u_prevPass.
  const postEffectPassIndices: number[] = []
  for (const fx of scene.postEffects) {
    if (!fx.enabled) continue
    const fxPasses = splitIntoPasses([fx])
    for (const p of fxPasses) {
      postEffectPassIndices.push(passes.length)
      passes.push(p)
    }
  }

  return {
    passes,
    layers: layerEntries,
    compositorPassIndex,
    postEffectPassIndices,
  }
}
