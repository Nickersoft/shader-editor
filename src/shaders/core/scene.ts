// Scene + Layer — the Figma-style two-level tree that supersedes the flat
// `ShaderChain`. A Scene contains an ordered list of Layers (each = one
// GeneratorNode source plus its own EffectNode chain) plus optional
// post-composite EffectNodes that run on the composited canvas.
//
// Render order:
//   for each Layer (bottom → top): source + layer.effects → layer texture
//   compositor pass: blend layer textures with each layer's blendMode/opacity
//   for each post-effect: read prev pass, write next
//
// Today's flat chain is a degenerate case: one Layer with one Generator and
// any subsequent Effects attached to it.

import type { ShaderChain } from './chain'
import {
  EffectNode,
  GeneratorNode,
  isEffectNode,
  isGeneratorNode,
  type Node,
} from './node'
import { deserializeNode } from './registry'
import type { BlendMode, SerializedNode } from './types'

let layerCounter = 0
function defaultLayerId(): string {
  layerCounter += 1
  return `layer-${Date.now().toString(36)}-${layerCounter}`
}

export interface SerializedLayer {
  id: string
  name: string
  source: SerializedNode
  effects: SerializedNode[]
  blendMode: BlendMode
  opacity: number
  enabled: boolean
}

export interface SerializedScene {
  layers: SerializedLayer[]
  postEffects: SerializedNode[]
  background: { color: [number, number, number, number] }
}

export interface LayerInit {
  id?: string
  name?: string
  source: GeneratorNode
  effects?: EffectNode[]
  blendMode?: BlendMode
  opacity?: number
  enabled?: boolean
}

export class Layer {
  id: string
  name: string
  source: GeneratorNode
  effects: EffectNode[]
  blendMode: BlendMode
  opacity: number
  enabled: boolean

  constructor(init: LayerInit) {
    this.id = init.id ?? defaultLayerId()
    this.source = init.source
    this.effects = init.effects ?? []
    this.name = init.name ?? init.source.meta.name
    this.blendMode = init.blendMode ?? init.source.blendMode
    this.opacity = init.opacity ?? 1
    this.enabled = init.enabled ?? true
  }

  /** All GLSL nodes inside this layer, in render order. */
  get nodes(): Node[] {
    return [this.source, ...this.effects]
  }

  toJSON(): SerializedLayer {
    return {
      id: this.id,
      name: this.name,
      source: this.source.toJSON(),
      effects: this.effects.map((e) => e.toJSON()),
      blendMode: this.blendMode,
      opacity: this.opacity,
      enabled: this.enabled,
    }
  }

  static fromJSON(json: SerializedLayer): Layer {
    const source = deserializeNode(json.source)
    if (!isGeneratorNode(source)) {
      throw new Error(
        `Layer "${json.id}" source must be a GeneratorNode (got ${json.source.typeId})`,
      )
    }
    const effects = json.effects.map((e) => {
      const node = deserializeNode(e)
      if (!isEffectNode(node)) {
        throw new Error(
          `Layer "${json.id}" effect must be an EffectNode (got ${e.typeId})`,
        )
      }
      return node
    })
    return new Layer({
      id: json.id,
      name: json.name,
      source,
      effects,
      blendMode: json.blendMode,
      opacity: json.opacity,
      enabled: json.enabled,
    })
  }

  clone(): Layer {
    return Layer.fromJSON(this.toJSON())
  }
}

export interface SceneInit {
  layers?: Layer[]
  postEffects?: EffectNode[]
  background?: { color: [number, number, number, number] }
}

const DEFAULT_BACKGROUND: [number, number, number, number] = [0, 0, 0, 1]

export class Scene {
  layers: Layer[]
  postEffects: EffectNode[]
  background: { color: [number, number, number, number] }

  constructor(init: SceneInit = {}) {
    this.layers = init.layers ?? []
    this.postEffects = init.postEffects ?? []
    this.background = init.background ?? { color: [...DEFAULT_BACKGROUND] }
  }

  /** Find a layer by id. */
  findLayer(id: string): Layer | undefined {
    return this.layers.find((l) => l.id === id)
  }

  /**
   * Locate any GLSL node by id — the source or an effect of any layer, or a
   * scene post-effect. Returns the node plus the layer that owns it
   * (`null` for scene post-effects).
   */
  findNode(
    id: string,
  ): { node: Node; layer: Layer | null } | undefined {
    for (const layer of this.layers) {
      if (layer.source.id === id) return { node: layer.source, layer }
      const fx = layer.effects.find((e) => e.id === id)
      if (fx) return { node: fx, layer }
    }
    const sceneFx = this.postEffects.find((e) => e.id === id)
    if (sceneFx) return { node: sceneFx, layer: null }
    return undefined
  }

  /** Enabled layers in render order. */
  get enabledLayers(): Layer[] {
    return this.layers.filter((l) => l.enabled)
  }

  toJSON(): SerializedScene {
    return {
      layers: this.layers.map((l) => l.toJSON()),
      postEffects: this.postEffects.map((e) => e.toJSON()),
      background: { color: [...this.background.color] },
    }
  }

  static fromJSON(json: SerializedScene): Scene {
    const layers = json.layers.map((l) => Layer.fromJSON(l))
    const postEffects = (json.postEffects ?? []).map((e) => {
      const node = deserializeNode(e)
      if (!isEffectNode(node)) {
        throw new Error(
          `Scene postEffect must be an EffectNode (got ${e.typeId})`,
        )
      }
      return node
    })
    return new Scene({
      layers,
      postEffects,
      background: json.background ?? { color: [...DEFAULT_BACKGROUND] },
    })
  }

  clone(): Scene {
    return Scene.fromJSON(this.toJSON())
  }
}

/** Fluent constructor. */
export function scene(...layers: Layer[]): Scene {
  return new Scene({ layers })
}

/**
 * Bridge for Phase 1 — flatten a Scene back into a single ShaderChain so the
 * existing codegen/runtime keeps working before scene-aware codegen lands in
 * Phase 2. The flattening is "render-order naive": all layers' generators +
 * effects in order, then scene post-effects. Multi-layer scenes will not
 * render correctly through this path (effects bleed across layers); this
 * bridge is only meant to keep the editor functional during the rewrite.
 */
export function flattenSceneToChain(scene: Scene): Node[] {
  const out: Node[] = []
  for (const layer of scene.enabledLayers) {
    out.push(layer.source)
    for (const fx of layer.effects) out.push(fx)
  }
  for (const fx of scene.postEffects) out.push(fx)
  return out
}

export function chainToScene(chain: ShaderChain): Scene {
  return migrateChainNodes(chain.nodes)
}

/**
 * Greedy chain → Scene migration. Walks the flat node list:
 *   - Each GeneratorNode starts a new Layer.
 *   - Each subsequent EffectNode (or ProcessingNode) attaches to the current
 *     Layer until the next GeneratorNode or end of chain.
 *   - Effects/Processing nodes that appear before any Generator are dropped
 *     (a chain that starts with an Effect has no source to operate on; in
 *     today's runtime that produces a transparent prev-pass, which we treat
 *     as "no layer").
 *
 * Preserves today's visual output exactly when the chain has the common
 * shape of one Generator at the head followed by Effects.
 */
function migrateChainNodes(nodes: Node[]): Scene {
  const layers: Layer[] = []
  let current: { source: GeneratorNode; effects: EffectNode[] } | null = null

  const flush = () => {
    if (current) {
      layers.push(
        new Layer({
          source: current.source,
          effects: current.effects,
          blendMode: current.source.blendMode,
          opacity: current.source.opacity,
          enabled: current.source.enabled,
        }),
      )
      current = null
    }
  }

  for (const node of nodes) {
    if (isGeneratorNode(node)) {
      flush()
      current = { source: node, effects: [] }
      continue
    }
    if (isEffectNode(node) && current) {
      current.effects.push(node)
      continue
    }
    // ProcessingNode or stray Effect with no source — dropped.
  }
  flush()

  return new Scene({ layers })
}
