// Scene + Layer — the Figma-style two-level tree. A Scene contains an ordered
// list of Layers (each = one generator Shader source plus its own Effect
// chain) plus optional post-composite Effects that run on the composited
// canvas.
//
// Render order:
//   for each Layer (bottom → top): source + layer.effects → layer texture
//   compositor pass: blend layer textures with each layer's blendMode/opacity
//   for each post-effect: read prev pass, write next

import { Layer, type FlatLayer, type SerializedLayer } from "./layer.svelte";
import { deserializeShader } from "./registry";
import { Effect, isEffect, type Shader, type SerializedShader } from "./shader.svelte";

export interface SceneInit {
  layers?: Layer[];
  postEffects?: Effect[];
  background?: { color: [number, number, number, number] };
}

export interface SerializedScene {
  layers: SerializedLayer[];
  postEffects: SerializedShader[];
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

  postEffects = $state<Effect[]>([]);

  background = $state<{ color: [number, number, number, number] }>({
    color: [...DEFAULT_BACKGROUND],
  });

  // Cached id→layer/shader/parent indexes. One walk per structural change
  // (layer or effect added/removed/reparented, source swap) feeds all of
  // findLayer/findShader/findLayerParent/isDescendant at O(1). Per-frame
  // mutations to opacity/blendMode/inputs don't invalidate these.
  readonly layerById: Map<string, Layer> = $derived.by(() => {
    const m = new Map<string, Layer>();

    walkSubtree(this.layers, null, (layer) => {
      m.set(layer.id, layer);
    });

    return m;
  });

  readonly shaderById: Map<string, { shader: Shader; layer: Layer | null }> = $derived.by(() => {
    const m = new Map<string, { shader: Shader; layer: Layer | null }>();

    walkSubtree(this.layers, null, (layer) => {
      m.set(layer.source.id, { shader: layer.source, layer });

      // Container shaders (e.g. ProceduralShader) expose owned sub-shaders
      // via the `subShaders()` hook. Index each so selection / property-
      // panel / input updates can address them by id like any other shader.
      const subs = layer.source.subShaders?.() ?? [];
      for (const sub of subs) {
        m.set(sub.id, { shader: sub, layer });
      }

      for (const fx of layer.effects) {
        m.set(fx.id, { shader: fx, layer });
      }

      return undefined;
    });

    for (const fx of this.postEffects) {
      m.set(fx.id, { shader: fx, layer: null });
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
   * walk and propagates that value out. Prefer `layerById`/`shaderById` for
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
   * Locate any shader by id — the source or an effect of any layer (at any
   * depth), or a scene post-effect. Returns the shader plus the layer that
   * owns it (`null` for scene post-effects).
   */
  findShader(id: string): { shader: Shader; layer: Layer | null } | undefined {
    return this.shaderById.get(id);
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

  get enabledLayers(): Layer[] {
    return this.layers.filter((l) => l.enabled);
  }

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
      const shader = deserializeShader(e);

      if (!isEffect(shader)) {
        throw new Error(`Scene postEffect must be an Effect (got ${e.typeId})`);
      }

      return shader;
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

// Re-export Layer so the many callers that import from `scene.svelte` keep working.
export { Layer } from "./layer.svelte";
export type { FlatLayer, SerializedLayer } from "./layer.svelte";
