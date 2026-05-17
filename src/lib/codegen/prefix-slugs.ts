// Assigns human-readable GLSL uniform prefixes to every Shader that
// contributes GLSL to the scene. Without this pass the codegen would emit
// cryptic prefixes derived from the shader id (`u_l1a2b3c4_color`); with it,
// the emitted shader uses the layer's display name (`u_voronoi_color`,
// `u_voronoi2_color` for a second instance).
//
// The assignment lives on the Shader instance via `prefixOverride` so the
// shader's own `glsl()` method emits matching uniform references through
// `this.uniformName(...)`.

import type { Scene } from "@/shaders/core/scene.svelte";
import { sanitizeName, type Shader } from "@/shaders/core/shader.svelte";

export function camelCase(s: string): string {
  const parts = s
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join("")
  );
}

/**
 * Walks every contributing node in the scene (layer sources, layer effects,
 * scene post-effects) and assigns each a `prefixOverride` derived from the
 * class meta name. Duplicates get a 1-based suffix.
 *
 * Idempotent — safe to call before each codegen run.
 */
export function assignPrefixSlugs(scene: Scene): void {
  const seen = new Set<string>();
  const slugCount = new Map<string, number>();
  const nodes: Shader[] = [];

  for (const layer of scene.layers) {
    if (!layer.enabled) continue;
    nodes.push(layer.source);
    for (const fx of layer.effects) nodes.push(fx);
  }
  for (const fx of scene.postEffects) nodes.push(fx);

  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const base = camelCase(node.meta.name) || sanitizeName(node.id);
    const used = (slugCount.get(base) ?? 0) + 1;
    slugCount.set(base, used);
    node.prefixOverride = used > 1 ? `${base}${used}` : base;
  }
}
