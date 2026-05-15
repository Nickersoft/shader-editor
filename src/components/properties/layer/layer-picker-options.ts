import {
  EffectNode,
  type EffectAppliesTo,
  getEffectAppliesTo,
  getEffectScope,
  type NodeClass,
} from "@/shaders/core/node.svelte";
import { listNodeClasses } from "@/shaders/core/registry";
import type { Category } from "@/shaders/core/types";

export function layerPickerOptions(
  categories: Category[],
  sourceKind: EffectAppliesTo,
): NodeClass[] {
  return listNodeClasses()
    .filter((cls) => {
      const proto = (cls as unknown as typeof EffectNode).prototype;
      if (!(proto instanceof EffectNode)) return false;
      if (!categories.includes(cls.meta.category)) return false;
      if (getEffectScope(cls) === "scene") return false;
      const allowed = getEffectAppliesTo(cls);
      if (allowed.includes("any")) return true;
      return allowed.includes(sourceKind);
    })
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}
