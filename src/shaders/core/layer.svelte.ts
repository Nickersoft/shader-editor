// Render order:
//   for each Layer (bottom → top): source + layer.effects → layer texture
//   compositor pass: blend layer textures with each layer's blendMode/opacity
//   for each post-effect: read prev pass, write next

import { makeId } from "@/lib/utils";
import {
  EffectNode,
  GeneratorNode,
  isEffectNode,
  isGeneratorNode,
  type Node,
  type SerializedNode,
} from "./node.svelte";
import { deserializeNode } from "./registry";
import type { BlendMode } from "./types";

export interface SerializedLayer {
  id: string;
  name: string;
  source: SerializedNode;
  effects: SerializedNode[];
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
  source: GeneratorNode;
  effects?: EffectNode[];
  blendMode?: BlendMode;
  opacity?: number;
  enabled?: boolean;
  children?: Layer[];
}

export class Layer {
  id: string;
  name = $state("");
  source = $state<GeneratorNode>(null!);
  effects = $state<EffectNode[]>([]);
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

  /** All GLSL nodes inside this layer, in render order. */
  get nodes(): Node[] {
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
    const source = deserializeNode(json.source);

    if (!isGeneratorNode(source)) {
      throw new Error(
        `Layer "${json.id}" source must be a GeneratorNode (got ${json.source.typeId})`,
      );
    }

    const effects = json.effects.map((e) => {
      const node = deserializeNode(e);

      if (!isEffectNode(node)) {
        throw new Error(`Layer "${json.id}" effect must be an EffectNode (got ${e.typeId})`);
      }

      return node;
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
