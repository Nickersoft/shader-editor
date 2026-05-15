import {
  EffectNode,
  getEffectScope,
  type NodeClass,
} from "@/shaders/core/node.svelte";
import { listNodeClasses } from "@/shaders/core/registry";
import type { Category } from "@/shaders/core/types";

export function scenePickerOptions(categories: Category[]): NodeClass[] {
  return listNodeClasses()
    .filter((cls) => {
      const proto = (cls as unknown as typeof EffectNode).prototype;
      if (!(proto instanceof EffectNode)) return false;
      if (!categories.includes(cls.meta.category)) return false;
      const scope = getEffectScope(cls);
      // Layer-only effects can't sit at the composited-canvas stage —
      // they need a layer's source as input.
      return scope === "scene" || scope === "both";
    })
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}
