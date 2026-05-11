// Scene + Layer — the Figma-style two-level tree. A Scene contains an ordered
// list of Layers (each = one GeneratorNode source plus its own EffectNode
// chain) plus optional post-composite EffectNodes that run on the composited
// canvas.
//
// Render order:
//   for each Layer (bottom → top): source + layer.effects → layer texture
//   compositor pass: blend layer textures with each layer's blendMode/opacity
//   for each post-effect: read prev pass, write next

import { Layer, type FlatLayer, type SerializedLayer } from "./layer.svelte";
import { EffectNode, isEffectNode, type Node, type SerializedNode } from "./node.svelte";
import { deserializeNode } from "./registry";

export interface SceneInit {
  layers?: Layer[];
  postEffects?: EffectNode[];
  background?: { color: [number, number, number, number] };
}

export interface SerializedScene {
  layers: SerializedLayer[];
  postEffects: SerializedNode[];
  background: { color: [number, number, number, number] };
}

const DEFAULT_BACKGROUND: [number, number, number, number] = [0, 0, 0, 0];

function walkSubtree<R>(
  layers: Layer[],
  parent: Layer | null,
  visit: (layer: Layer, parent: Layer | null) => R | undefined,
): R | undefined {
  for (const l of layers) {
    const r = visit(l, parent);

    if (r !== undefined) {
      return r;
    }

    const c = walkSubtree(l.children, l, visit);

    if (c !== undefined) {
      return c;
    }
  }

  return undefined;
}

export class Scene {
  layers = $state<Layer[]>([]);

  postEffects = $state<EffectNode[]>([]);

  background = $state<{ color: [number, number, number, number] }>({
    color: [...DEFAULT_BACKGROUND],
  });

  // Cached id→layer/node/parent indexes. One walk per structural change
  // (layer or effect added/removed/reparented, source swap) feeds all of
  // findLayer/findNode/findLayerParent/isDescendant at O(1). Per-frame
  // mutations to opacity/blendMode/config don't invalidate these.
  readonly layerById: Map<string, Layer> = $derived.by(() => {
    const m = new Map<string, Layer>();

    walkSubtree(this.layers, null, (layer) => {
      m.set(layer.id, layer);
    });

    return m;
  });

  readonly nodeById: Map<string, { node: Node; layer: Layer | null }> = $derived.by(() => {
    const m = new Map<string, { node: Node; layer: Layer | null }>();

    walkSubtree(this.layers, null, (layer) => {
      m.set(layer.source.id, { node: layer.source, layer });

      for (const fx of layer.effects) {
        m.set(fx.id, { node: fx, layer });
      }

      return undefined;
    });

    for (const fx of this.postEffects) {
      m.set(fx.id, { node: fx, layer: null });
    }

    return m;
  });

  // `undefined` on miss; `null` when the layer is top-level.
  readonly parentByChildId: Map<string, Layer | null> = $derived.by(() => {
    const m = new Map<string, Layer | null>();

    walkSubtree(this.layers, null, (l, parent) => {
      m.set(l.id, parent);
    });

    return m;
  });

  constructor(init: SceneInit = {}) {
    this.layers = init.layers ?? [];
    this.postEffects = init.postEffects ?? [];
    this.background = init.background ?? { color: [...DEFAULT_BACKGROUND] };
  }

  /**
   * Depth-first walk over the layer tree. Visitor receives each layer plus
   * its parent (null for top-level). Returning a value short-circuits the
   * walk and propagates that value out. Prefer `layerById`/`nodeById` for
   * pure id lookups — this is for traversals that need the structure itself.
   */
  walkLayers<R>(visit: (layer: Layer, parent: Layer | null) => R | undefined): R | undefined {
    return walkSubtree(this.layers, null, visit);
  }

  findLayer(id: string): Layer | undefined {
    return this.layerById.get(id);
  }

  /** Parent of `id`, or `null` if top-level, or `undefined` if not found. */
  findLayerParent(id: string): Layer | null | undefined {
    if (!this.layerById.has(id)) {
      return undefined;
    }
    return this.parentByChildId.get(id) ?? null;
  }

  /** True if `candidateId` is `ancestorId` or one of its descendants. */
  isDescendant(ancestorId: string, candidateId: string): boolean {
    if (ancestorId === candidateId) {
      return this.layerById.has(ancestorId);
    }

    if (!this.layerById.has(ancestorId)) {
      return false;
    }

    // Walk up the parent chain from candidate — O(depth), no subtree walk.
    let current = this.parentByChildId.get(candidateId);

    while (current) {
      if (current.id === ancestorId) {
        return true;
      }
      current = this.parentByChildId.get(current.id);
    }

    return false;
  }

  /**
   * Locate any GLSL node by id — the source or an effect of any layer (at any
   * depth), or a scene post-effect. Returns the node plus the layer that owns
   * it (`null` for scene post-effects).
   */
  findNode(id: string): { node: Node; layer: Layer | null } | undefined {
    return this.nodeById.get(id);
  }

  /**
   * Detach `id` from wherever it lives (top-level or any nested children
   * list) and return it.
   */
  detachLayer(id: string): Layer | null {
    const parent = this.parentByChildId.get(id);

    if (parent === undefined) {
      return null;
    }

    const list = parent === null ? this.layers : parent.children;
    const idx = list.findIndex((l) => l.id === id);

    if (idx < 0) {
      return null;
    }

    return list.splice(idx, 1)[0] ?? null;
  }

  /**
   * Enabled top-level layers in render order. Children are NOT included here
   * — use `flatLayers()` for the render-order traversal that drives the
   * compositor.
   */
  get enabledLayers(): Layer[] {
    return this.layers.filter((l) => l.enabled);
  }

  /**
   * Flatten the layer tree into render order, parent-before-children. Each
   * entry carries its index in the flat list and the index of its clipping
   * parent (or null for un-clipped top-level layers). Disabled layers — and
   * any descendants of a disabled layer — are skipped.
   */
  flatLayers(): FlatLayer[] {
    const out: FlatLayer[] = [];
    const walk = (layer: Layer, parentFlatIndex: number | null) => {
      if (!layer.enabled) {
        return;
      }

      const myIndex = out.length;

      out.push({
        layer,
        flatIndex: myIndex,
        parentFlatIndex,
      });

      for (const child of layer.children) {
        walk(child, myIndex);
      }
    };

    for (const l of this.layers) {
      walk(l, null);
    }

    return out;
  }

  toJSON(): SerializedScene {
    return {
      layers: this.layers.map((l) => l.toJSON()),
      postEffects: this.postEffects.map((e) => e.toJSON()),
      background: { color: [...this.background.color] },
    };
  }

  static fromJSON(json: SerializedScene): Scene {
    const layers = json.layers.map((l) => Layer.fromJSON(l));

    const postEffects = (json.postEffects ?? []).map((e) => {
      const node = deserializeNode(e);

      if (!isEffectNode(node)) {
        throw new Error(`Scene postEffect must be an EffectNode (got ${e.typeId})`);
      }

      return node;
    });

    return new Scene({
      layers,
      postEffects,
      background: json.background ?? {
        color: [...DEFAULT_BACKGROUND],
      },
    });
  }
}
