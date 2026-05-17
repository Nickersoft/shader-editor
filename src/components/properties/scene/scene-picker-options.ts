import {
  Effect,
  getEffectScope,
  type ShaderClass,
} from "@/shaders/core/shader.svelte";
import { listShaderClasses } from "@/shaders/core/registry";
import type { Category } from "@/shaders/core/types";

export function scenePickerOptions(categories: Category[]): ShaderClass[] {
  return listShaderClasses()
    .filter((cls) => {
      const proto = (cls as unknown as typeof Effect).prototype;
      if (!(proto instanceof Effect)) return false;
      if (!categories.includes(cls.meta.category)) return false;
      const scope = getEffectScope(cls);
      // Layer-only effects can't sit at the composited-canvas stage —
      // they need a layer's source as input.
      return scope === "scene" || scope === "both";
    })
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}
