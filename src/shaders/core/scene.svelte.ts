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
} from './node.svelte'
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
  useAsMask?: boolean
  /** Clip-mask children — render order siblings whose alpha is gated by this
   *  layer's alpha. */
  children?: SerializedLayer[]
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
  useAsMask?: boolean
  children?: Layer[]
}

export class Layer {
  id: string
  name = $state('')
  source = $state<GeneratorNode>(null!)
  effects = $state<EffectNode[]>([])
  blendMode = $state<BlendMode>('normal')
  opacity = $state(1)
  enabled = $state(true)
  // When true, this layer doesn't draw — its alpha gates every layer beneath
  // it in the stack. Stacks multiplicatively with other masks above it.
  useAsMask = $state(false)
  // Clip-mask children. Each child renders into its own layer texture but is
  // composited with its alpha multiplied by this layer's alpha (Figma-style
  // clipping mask / "clipped to shape").
  children = $state<Layer[]>([])

  constructor(init: LayerInit) {
    this.id = init.id ?? defaultLayerId()
    this.source = init.source
    this.effects = init.effects ?? []
    this.name = init.name ?? init.source.meta.name
    this.blendMode = init.blendMode ?? init.source.blendMode
    this.opacity = init.opacity ?? 1
    this.enabled = init.enabled ?? true
    this.useAsMask = init.useAsMask ?? false
    this.children = init.children ?? []
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
      useAsMask: this.useAsMask,
      children: this.children.length > 0
        ? this.children.map((c) => c.toJSON())
        : undefined,
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
    const children = (json.children ?? []).map((c) => Layer.fromJSON(c))
    return new Layer({
      id: json.id,
      name: json.name,
      source,
      effects,
      blendMode: json.blendMode,
      opacity: json.opacity,
      enabled: json.enabled,
      useAsMask: json.useAsMask ?? false,
      children,
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

/**
 * One entry in `Scene.flatLayers()`. `flatIndex` is this layer's slot in the
 * flat array (and matches the `u_layer_<i>` texture slot the compositor binds
 * for it). `parentFlatIndex` is the index of the clipping parent — when
 * non-null, the compositor multiplies this layer's alpha by the parent's
 * alpha before blending.
 */
export interface FlatLayer {
  layer: Layer
  flatIndex: number
  parentFlatIndex: number | null
}

const DEFAULT_BACKGROUND: [number, number, number, number] = [0, 0, 0, 0]

export class Scene {
  layers = $state<Layer[]>([])
  postEffects = $state<EffectNode[]>([])
  background = $state<{ color: [number, number, number, number] }>({ color: [...DEFAULT_BACKGROUND] })

  constructor(init: SceneInit = {}) {
    this.layers = init.layers ?? []
    this.postEffects = init.postEffects ?? []
    this.background = init.background ?? { color: [...DEFAULT_BACKGROUND] }
  }

  /** Find a layer by id (recursive — searches into children). */
  findLayer(id: string): Layer | undefined {
    const walk = (layers: Layer[]): Layer | undefined => {
      for (const l of layers) {
        if (l.id === id) return l
        const c = walk(l.children)
        if (c) return c
      }
      return undefined
    }
    return walk(this.layers)
  }

  /** Find a layer's parent by id (or null if it's at the top level). */
  findLayerParent(id: string): Layer | null | undefined {
    const walk = (layers: Layer[], parent: Layer | null): Layer | null | undefined => {
      for (const l of layers) {
        if (l.id === id) return parent
        const c = walk(l.children, l)
        if (c !== undefined) return c
      }
      return undefined
    }
    return walk(this.layers, null)
  }

  /**
   * Locate any GLSL node by id — the source or an effect of any layer (at any
   * depth), or a scene post-effect. Returns the node plus the layer that owns
   * it (`null` for scene post-effects).
   */
  findNode(
    id: string,
  ): { node: Node; layer: Layer | null } | undefined {
    const walk = (layers: Layer[]): { node: Node; layer: Layer | null } | undefined => {
      for (const layer of layers) {
        if (layer.source.id === id) return { node: layer.source, layer }
        const fx = layer.effects.find((e) => e.id === id)
        if (fx) return { node: fx, layer }
        const found = walk(layer.children)
        if (found) return found
      }
      return undefined
    }
    const found = walk(this.layers)
    if (found) return found
    const sceneFx = this.postEffects.find((e) => e.id === id)
    if (sceneFx) return { node: sceneFx, layer: null }
    return undefined
  }

  /**
   * Enabled top-level layers in render order. Children are NOT included here
   * — use `flatLayers()` for the render-order traversal that drives the
   * compositor.
   */
  get enabledLayers(): Layer[] {
    return this.layers.filter((l) => l.enabled)
  }

  /**
   * Flatten the layer tree into render order, parent-before-children. Each
   * entry carries its index in the flat list and the index of its clipping
   * parent (or null for un-clipped top-level layers). Disabled layers — and
   * any descendants of a disabled layer — are skipped.
   */
  flatLayers(): FlatLayer[] {
    const out: FlatLayer[] = []
    const walk = (layer: Layer, parentFlatIndex: number | null) => {
      if (!layer.enabled) return
      const myIndex = out.length
      out.push({ layer, flatIndex: myIndex, parentFlatIndex })
      for (const child of layer.children) walk(child, myIndex)
    }
    for (const l of this.layers) walk(l, null)
    return out
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
  for (const flat of scene.flatLayers()) {
    out.push(flat.layer.source)
    for (const fx of flat.layer.effects) out.push(fx)
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
