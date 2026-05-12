// Codegen entry point. Walks a `Scene` (Figma-style tree of layers + scene-
// level post-effects) and produces a `GeneratedShader` containing per-pass
// fragment shaders, a vertex shader, an enumerated uniform list (used by the
// runtime to bind values), and the source-string exports.

import { isProcessingNode } from "@/shaders/core/node.svelte";
import { Scene } from "@/shaders/core/scene.svelte";
import { splitIntoPasses } from "./passes";
import { planScene } from "./scene-passes";
import { buildFragment, buildCompositorFragment } from "./fragment";
import { buildVertexShader, fragmentNeedsStructuredUv } from "./vertex";
import { inspectObjectSchema } from "./schema-introspection";
import { assignPrefixSlugs } from "./prefix-slugs";
import { generateTypeScript } from "./export/typescript";
import { generateReactComponent } from "./export/react";
import { generateVanillaJs } from "./export/vanilla";
import type { GeneratedPass, GeneratedShader, GeneratedUniform } from "./types";

export type { GeneratedShader, GeneratedPass, GeneratedUniform } from "./types";
export { planScene } from "./scene-passes";

export function generate(scene: Scene, shaderName = "CustomShader"): GeneratedShader {
  // Assign human-readable GLSL uniform prefixes (e.g. `voronoi`, `circle2`)
  // before any glsl() call. This makes both uniform declarations and the
  // node.uniformName() references inside glsl() use readable names.
  assignPrefixSlugs(scene);

  const plan = planScene(scene);
  const layerCount = plan.layers.length;

  // 1. Collect uniforms from every contributing GLSL node.
  const uniforms: GeneratedUniform[] = [];
  const collectFromNode = (node: import("@/shaders/core/node.svelte").Node) => {
    const prefix = node.prefix;
    const layerName = node.meta.name;

    uniforms.push({
      name: `u_${prefix}_opacity`,
      type: "float",
      default: node.opacity,
      layerName,
      originalName: "opacity",
    });

    if (isProcessingNode(node)) {
      uniforms.push({
        name: `u_${prefix}_jsOutput`,
        type: "sampler2D",
        default: null,
        layerName,
        originalName: "jsOutput",
        isSampler2D: true,
      });
    }

    const cls = node.cls;
    const cfgFields = inspectObjectSchema(cls.config);
    const inFields = inspectObjectSchema(cls.inputs);
    for (const field of [...cfgFields, ...inFields]) {
      const value =
        field.key in node.config
          ? (node.config as Record<string, unknown>)[field.key]
          : (node.inputs as Record<string, unknown>)[field.key];
      uniforms.push({
        name: `u_${prefix}_${field.key}`,
        type: field.glslType,
        default: value,
        layerName,
        originalName: field.key,
        arrayLength: field.arrayLength,
        isSampler2D: field.glslType === "sampler2D",
      });
    }

    // Container nodes (e.g. ProceduralField) may declare extra uniforms beyond
    // the static config schema — one per stage parameter, etc.
    const extras = node.extraUniforms?.() ?? [];
    for (const extra of extras) {
      uniforms.push({
        name: `u_${prefix}_${extra.nameSuffix}`,
        type: extra.type,
        default: extra.value,
        layerName,
        originalName: extra.originalName,
        originalPath: extra.originalPath,
        arrayLength: extra.arrayLength,
        isSampler2D: extra.type === "sampler2D",
      });
    }
  };

  for (const entry of plan.layers) {
    collectFromNode(entry.layer.source);
    for (const fx of entry.layer.effects) collectFromNode(fx);
  }
  for (const fx of scene.postEffects) collectFromNode(fx);

  // Per-layer uniforms (compositor opacity per layer + scene background).
  if (layerCount > 0) {
    uniforms.push({
      name: "u_sceneBackground",
      type: "vec4",
      default: scene.background.color,
      layerName: "Scene",
      originalName: "background",
    });
    for (let i = 0; i < layerCount; i++) {
      const layer = plan.layers[i].layer;
      uniforms.push({
        name: `u_layer_${i}_opacity`,
        type: "float",
        default: layer.opacity,
        layerName: layer.name,
        originalName: "layerOpacity",
      });
    }
  }

  // 2. Emit fragment shaders.
  const passes: GeneratedPass[] = plan.passes.map((p) => {
    if (p.mode === "compositor") {
      return buildCompositorFragment(
        plan.layers.map((l) => ({ layer: l.layer, parentIndex: l.parentIndex })),
      );
    }
    const built = buildFragment(p, { usesStructuredUv: false });
    if (p.commitToLayer !== undefined) built.commitToLayer = p.commitToLayer;
    if (p.bindLayerTextures) built.bindLayerTextures = true;
    return built;
  });

  // 3. Vertex shader.
  const usesStructuredUv = fragmentNeedsStructuredUv(passes.map((p) => p.fragmentShader));
  const vertexShader = buildVertexShader(usesStructuredUv);

  // 4. Concatenated fragment source for display.
  const fragmentShader = passes
    .map(
      (p, i) =>
        `// === Pass ${i + 1}/${passes.length}` +
        (p.readsPrevPass ? " (reads u_prevPass)" : "") +
        (p.mode ? ` (${p.mode})` : "") +
        (p.commitToLayer !== undefined ? ` (commits to layer ${p.commitToLayer})` : "") +
        ` ===\n${p.fragmentShader}`,
    )
    .join("\n\n");

  // 5. Source-string exports — single-layer projection of the scene through
  // the flat splitter. Multi-layer compositing isn't yet supported by the
  // export emitters, so we flatten enabled layers' nodes for emission.
  const exportNodes = plan.layers.flatMap((l) => [l.layer.source, ...l.layer.effects]);
  const exportPasses = splitIntoPasses(exportNodes).map((p) =>
    buildFragment(p, { usesStructuredUv }),
  );
  const typescript = generateTypeScript(uniforms, shaderName);
  const reactComponent = generateReactComponent(uniforms, shaderName, exportPasses, vertexShader);
  const vanillaJs = generateVanillaJs(uniforms, shaderName, exportPasses, vertexShader);

  return {
    passes,
    vertexShader,
    uniforms,
    typescript,
    reactComponent,
    vanillaJs,
    fragmentShader,
    layerRefs: plan.layers.map((l) => ({ id: l.layer.id })),
  };
}
