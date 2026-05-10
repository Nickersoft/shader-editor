// Codegen entry point. Walks a `Scene` (Figma-style tree of layers + scene-
// level post-effects) and produces a `GeneratedShader` containing per-pass
// fragment shaders, a vertex shader, an enumerated uniform list (used by the
// runtime to bind values), and the source-string exports.
//
// The legacy `generate(chain)` overload converts the flat chain to a single-
// layer Scene first so existing tooling (the smoke script, the export
// emitters) keeps working unchanged.

import type { ShaderChain } from '@/shaders/core/chain'
import { isProcessingNode } from '@/shaders/core/node.svelte'
import { Scene, chainToScene } from '@/shaders/core/scene.svelte'
import { splitIntoPasses } from './passes'
import { planScene } from './scene-passes'
import { buildFragment, buildCompositorFragment } from './fragment'
import { buildVertexShader, fragmentNeedsStructuredUv } from './vertex'
import { inspectObjectSchema } from './schema-introspection'
import { assignPrefixSlugs } from './prefix-slugs'
import { generateTypeScript } from './export/typescript'
import { generateReactComponent } from './export/react'
import { generateVanillaJs } from './export/vanilla'
import type { GeneratedPass, GeneratedShader, GeneratedUniform } from './types'

export type { GeneratedShader, GeneratedPass, GeneratedUniform } from './types'
export { planScene } from './scene-passes'

export function generate(
  input: ShaderChain | Scene,
  shaderName = 'CustomShader',
): GeneratedShader {
  const scene = input instanceof Scene ? input : chainToScene(input)
  return generateFromScene(scene, shaderName)
}

function generateFromScene(
  scene: Scene,
  shaderName: string,
): GeneratedShader {
  // Assign human-readable GLSL uniform prefixes (e.g. `voronoi`, `circle2`)
  // before any glsl() call. This makes both uniform declarations and the
  // node.uniformName() references inside glsl() use readable names.
  assignPrefixSlugs(scene)

  const plan = planScene(scene)
  const layerCount = plan.layers.length

  // 1. Collect uniforms from every contributing GLSL node.
  const uniforms: GeneratedUniform[] = []
  const seenIds = new Set<string>()
  const collectFromNode = (node: import('@/shaders/core/node.svelte').Node) => {
    if (seenIds.has(node.id)) return
    seenIds.add(node.id)

    const prefix = node.prefix
    const layerName = node.meta.name

    uniforms.push({
      name: `u_${prefix}_opacity`,
      type: 'float',
      default: node.opacity,
      layerName,
      originalName: 'opacity',
    })

    if (isProcessingNode(node)) {
      uniforms.push({
        name: `u_${prefix}_jsOutput`,
        type: 'sampler2D',
        default: null,
        layerName,
        originalName: 'jsOutput',
        isSampler2D: true,
      })
    }

    const cls = node.cls
    const cfgFields = inspectObjectSchema(cls.config)
    const inFields = inspectObjectSchema(cls.inputs)
    for (const field of [...cfgFields, ...inFields]) {
      const value =
        field.key in node.config
          ? (node.config as Record<string, unknown>)[field.key]
          : (node.inputs as Record<string, unknown>)[field.key]
      uniforms.push({
        name: `u_${prefix}_${field.key}`,
        type: field.glslType,
        default: value,
        layerName,
        originalName: field.key,
        arrayLength: field.arrayLength,
        isSampler2D: field.glslType === 'sampler2D',
      })
    }
  }

  for (const entry of plan.layers) {
    collectFromNode(entry.layer.source)
    for (const fx of entry.layer.effects) collectFromNode(fx)
  }
  for (const fx of scene.postEffects) collectFromNode(fx)

  // Per-layer uniforms (compositor opacity per layer + scene background).
  if (layerCount > 0) {
    uniforms.push({
      name: 'u_sceneBackground',
      type: 'vec4',
      default: scene.background.color,
      layerName: 'Scene',
      originalName: 'background',
    })
    for (let i = 0; i < layerCount; i++) {
      const layer = plan.layers[i].layer
      uniforms.push({
        name: `u_layer_${i}_opacity`,
        type: 'float',
        default: layer.opacity,
        layerName: layer.name,
        originalName: 'layerOpacity',
      })
    }
  }

  // 2. Emit fragment shaders.
  const passes: GeneratedPass[] = plan.passes.map((p, i) => {
    if (p.mode === 'compositor') {
      const compositor = buildCompositorFragment(
        plan.layers.map((l) => ({ layer: l.layer, parentIndex: l.parentIndex })),
      )
      // Carry the planner's commitToLayer for the compositor (none — composes
      // straight into the ping-pong) but preserve any fields.
      return compositor
    }
    const built = buildFragment(p, { usesStructuredUv: false })
    if (p.commitToLayer !== undefined) built.commitToLayer = p.commitToLayer
    if (p.bindLayerTextures) built.bindLayerTextures = true
    // ProcessingNode passes aren't supported in scene model yet (they'd need
    // their JS output bound via the existing binder; their pass plan walks
    // through unchanged). Fall through.
    void i
    return built
  })

  // 3. Vertex shader.
  const usesStructuredUv = fragmentNeedsStructuredUv(
    passes.map((p) => p.fragmentShader),
  )
  const vertexShader = buildVertexShader(usesStructuredUv)

  // 4. Concatenated fragment source for display.
  const fragmentShader = passes
    .map(
      (p, i) =>
        `// === Pass ${i + 1}/${passes.length}` +
        (p.readsPrevPass ? ' (reads u_prevPass)' : '') +
        (p.mode ? ` (${p.mode})` : '') +
        (p.commitToLayer !== undefined
          ? ` (commits to layer ${p.commitToLayer})`
          : '') +
        ` ===\n${p.fragmentShader}`,
    )
    .join('\n\n')

  // 5. Source-string exports — operate on the same uniform list. Exports use
  // the legacy chain shape; for now we project the scene back to a chain via
  // splitIntoPasses on enabled layers' nodes flattened. This keeps emit code
  // working until the export emitters are scene-aware.
  const exportNodes = plan.layers.flatMap((l) => [
    l.layer.source,
    ...l.layer.effects,
  ])
  const exportPasses = splitIntoPasses(exportNodes).map((p) =>
    buildFragment(p, { usesStructuredUv }),
  )
  const typescript = generateTypeScript(uniforms, shaderName)
  const reactComponent = generateReactComponent(
    uniforms,
    shaderName,
    exportPasses,
    vertexShader,
  )
  const vanillaJs = generateVanillaJs(
    uniforms,
    shaderName,
    exportPasses,
    vertexShader,
  )

  return {
    passes,
    vertexShader,
    uniforms,
    typescript,
    reactComponent,
    vanillaJs,
    fragmentShader,
  }
}
