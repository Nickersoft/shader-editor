// One layer in a Scene — a generator Shader source plus its own ordered
// Effect chain. Reads/writes round-trip through `Layer.fromJSON` /
// `toJSON`.

import { makeId } from "@/lib/utils";

import { deserializeShader } from "./registry";
import {
  Effect,
  isEffect,
  isGenerator,
  type SerializedShader,
  type Shader,
} from "./shader.svelte";
import type { BlendMode } from "./types";

export interface SerializedLayer {
  id: string;
  name: string;
  source: SerializedShader;
  effects: SerializedShader[];
  blendMode: BlendMode;
  opacity: number;
  enabled: boolean;
  children?: SerializedLayer[];
}

/**
 * One entry in `Scene.flatLayers()`. `flatIndex` is this layer's slot in the
 * flat array (and matches the `u_layer_<i>` texture slot the compositor binds
 * for it). `parentFlatIndex` is the index of the clipping parent — when
 * non-null, the compositor multiplies this layer's alpha by the parent's
 * alpha before blending.
 */
export interface FlatLayer {
  layer: Layer;
  flatIndex: number;
  parentFlatIndex: number | null;
}

export interface LayerInit {
  id?: string;
  name?: string;
  source: Shader;
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  enabled?: boolean;
  children?: Layer[];
}

export class Layer {
  id: string;
  name = $state("");
  source = $state<Shader>(null!);
  effects = $state<Effect[]>([]);
  blendMode = $state<BlendMode>("normal");
  opacity = $state(1);
  enabled = $state(true);
  children = $state<Layer[]>([]);

  constructor(init: LayerInit) {
    this.id = init.id ?? makeId("layer");
    this.source = init.source;
    this.effects = init.effects ?? [];
    this.name = init.name ?? init.source.meta.name;
    this.blendMode = init.blendMode ?? init.source.blendMode;
    this.opacity = init.opacity ?? 1;
    this.enabled = init.enabled ?? true;
    this.children = init.children ?? [];
  }

  /** All shaders inside this layer, in render order. */
  get shaders(): Shader[] {
    return [this.source, ...this.effects];
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
      children: this.children.map((c) => c.toJSON()),
    };
  }

  static fromJSON(json: SerializedLayer): Layer {
    const source = deserializeShader(json.source);

    if (!isGenerator(source)) {
      throw new Error(
        `Layer "${json.id}" source must be a generator Shader (got ${json.source.typeId})`,
      );
    }

    const effects = json.effects.map((e) => {
      const shader = deserializeShader(e);

      if (!isEffect(shader)) {
        throw new Error(`Layer "${json.id}" effect must be an Effect (got ${e.typeId})`);
      }

      return shader;
    });

    const children = (json.children ?? []).map((c) => Layer.fromJSON(c));

    return new Layer({
      id: json.id,
      name: json.name,
      source,
      effects,
      blendMode: json.blendMode,
      opacity: json.opacity,
      enabled: json.enabled,
      children,
    });
  }
}
