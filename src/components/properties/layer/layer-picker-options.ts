import {
  Effect,
  type EffectAppliesTo,
  getEffectAppliesTo,
  getEffectScope,
  type ShaderClass,
} from "@/shaders/core/shader.svelte";
import { listShaderClasses } from "@/shaders/core/registry";
import type { Category } from "@/shaders/core/types";

export function layerPickerOptions(
  categories: Category[],
  sourceKind: EffectAppliesTo,
): ShaderClass[] {
  return listShaderClasses()
    .filter((cls) => {
      const proto = (cls as unknown as typeof Effect).prototype;
      if (!(proto instanceof Effect)) return false;
      if (!categories.includes(cls.meta.category)) return false;
      if (getEffectScope(cls) === "scene") return false;
      const allowed = getEffectAppliesTo(cls);
      if (allowed.includes("any")) return true;
      return allowed.includes(sourceKind);
    })
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}
