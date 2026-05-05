// Codegen entry point. Walks a `ShaderChain` and produces a `GeneratedShader`
// containing per-pass fragment shaders, a vertex shader, an enumerated uniform
// list (used by the runtime to bind values), and the source-string exports
// (TypeScript / React / Vanilla JS).

import type { ShaderChain } from '@/shaders/core/chain'
import { isProcessingNode } from '@/shaders/core/node'
import { splitIntoPasses } from './passes'
import { buildFragment } from './fragment'
import { buildVertexShader, fragmentNeedsStructuredUv } from './vertex'
import { inspectObjectSchema } from './schema-introspection'
import { generateTypeScript } from './export/typescript'
import { generateReactComponent } from './export/react'
import { generateVanillaJs } from './export/vanilla'
import type { GeneratedPass, GeneratedShader, GeneratedUniform } from './types'

export type { GeneratedShader, GeneratedPass, GeneratedUniform } from './types'

export function generate(
  chain: ShaderChain,
  shaderName = 'CustomShader',
): GeneratedShader {
  const enabled = chain.enabled

  // 1. Split into passes by node class.
  const plans = splitIntoPasses(enabled)

  // 2. Collect the global uniform list (every node contributes its own).
  const uniforms: GeneratedUniform[] = []
  for (const node of enabled) {
    const prefix = node.prefix
    const layerName = node.meta.name

    // Per-node opacity.
    uniforms.push({
      name: `u_${prefix}_opacity`,
      type: 'float',
      default: node.opacity,
      layerName,
      originalName: 'opacity',
    })

    // ProcessingNode JS pass binds an extra `u_<prefix>_jsOutput` sampler.
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

  // 3. Emit fragment shaders.
  const passes: GeneratedPass[] = plans.map((plan) =>
    buildFragment(plan, { usesStructuredUv: false }),
  )

  // 4. Emit vertex shader (auto-detect varying use).
  const usesStructuredUv = fragmentNeedsStructuredUv(
    passes.map((p) => p.fragmentShader),
  )
  const vertexShader = buildVertexShader(usesStructuredUv)

  // 5. Concatenate fragment sources for display purposes only.
  const fragmentShader = passes
    .map(
      (p, i) =>
        `// === Pass ${i + 1}/${passes.length}` +
        (p.readsPrevPass ? ' (reads u_prevPass)' : '') +
        (p.mode ? ` (${p.mode})` : '') +
        ` ===\n${p.fragmentShader}`,
    )
    .join('\n\n')

  // 6. Source-string exports (stubbed in Phase 1).
  const typescript = generateTypeScript(uniforms, shaderName)
  const reactComponent = generateReactComponent(
    uniforms,
    shaderName,
    passes,
    vertexShader,
  )
  const vanillaJs = generateVanillaJs(
    uniforms,
    shaderName,
    passes,
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
