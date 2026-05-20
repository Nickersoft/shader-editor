// Codegen entry point. Walks a `Scene` (Figma-style tree of layers + scene-
// level post-effects) and produces a `GeneratedShader` containing per-pass
// fragment shaders, a vertex shader, an enumerated uniform list (used by the
// runtime to bind values), and the source-string exports.

import { Scene } from "@/shaders/core/scene.svelte";
import { isProcessingShader, type Shader, type StaticShaderClass } from "@/shaders/core/shader.svelte";

import { generateReactComponent } from "./export/react";
import { generateTypeScript } from "./export/typescript";
import { generateVanillaJs } from "./export/vanilla";
import { buildBackdropFragment, buildCompositorFragment, buildFragment } from "./fragment";
import { splitIntoPasses } from "./passes";
import { assignPrefixSlugs } from "./prefix-slugs";
import { planScene } from "./scene-passes";
import { inspectUniformFields } from "./schema-introspection";
import type { GeneratedPass, GeneratedShader, GeneratedUniform } from "./types";
import { buildVertexShader, fragmentNeedsStructuredUv } from "./vertex";

export type { GeneratedShader, GeneratedPass, GeneratedUniform } from "./types";
export { planScene } from "./scene-passes";

export function generate(scene: Scene, shaderName = "CustomShader"): GeneratedShader {
  // Assign human-readable GLSL uniform prefixes (e.g. `voronoi`, `circle2`)
  // before any glsl() call. This makes both uniform declarations and the
  // node.uniformName() references inside glsl() use readable names.
  assignPrefixSlugs(scene);

  const plan = planScene(scene);
  const layerCount = plan.layers.length;

  // 1. Collect uniforms from every contributing shader.
  const uniforms: GeneratedUniform[] = [];
  const collectFromNode = (node: Shader) => {
    const prefix = node.prefix;
    const layerName = node.meta.name;

    uniforms.push({
      name: `u_${prefix}_opacity`,
      type: "float",
      default: node.opacity,
      layerName,
      originalName: "opacity",
    });

    if (isProcessingShader(node)) {
      uniforms.push({
        name: `u_${prefix}_jsOutput`,
        type: "sampler2D",
        default: null,
        layerName,
        originalName: "jsOutput",
        isSampler2D: true,
      });
    }

    // The unified `schema` declares every uniform-eligible field. Enum-string
    // fields branch GLSL source and are filtered out of GPU bindings by
    // `inspectUniformFields` — they remain in the schema only for parsing +
    // property-panel.
    const cls = node.cls as StaticShaderClass;
    const uniformFields = cls.schema ? inspectUniformFields(cls.schema) : [];
    const inputs = node.inputs as Record<string, unknown>;
    for (const field of uniformFields) {
      const value = inputs[field.key];
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

    // Container shaders (ProceduralShader / ProceduralEffect) declare extra
    // uniforms beyond the static schema — one per graph-primitive parameter.
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
    if (p.mode === "backdrop") {
      const upTo = p.layerCountForBackdrop ?? 0;
      const sliced = plan.layers
        .slice(0, upTo)
        .map((l) => ({
          layer: l.layer,
          // Clip-mask parent references point into the *full* layer array;
          // when a child slips into the backdrop set without its parent,
          // drop the parent reference to keep the slice self-contained.
          parentIndex: l.parentIndex !== null && l.parentIndex < upTo ? l.parentIndex : null,
        }));
      return buildBackdropFragment(sliced);
    }
    const built = buildFragment(p, { usesStructuredUv: false });
    if (p.commitToLayer !== undefined) built.commitToLayer = p.commitToLayer;
    if (p.bindLayerTextures) built.bindLayerTextures = true;
    if (p.readsBackdrop) built.readsBackdrop = true;
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
