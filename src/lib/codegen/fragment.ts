// Per-pass fragment-shader emission.
//
// For a normal pass: collects the GLSL block from each contributing node,
// emits utility-function dependencies, layer wrappers, and a `main()` that
// blends each layer onto the running color.
//
// For a 'js' pass: emits a degenerate program that samples the
// ProcessingNode's CPU-computed output texture (`u_<prefix>_jsOutput`) and
// writes it through with the node's opacity applied.
//
// For a 'glsl-render' pass: same code path as a normal EffectNode pass, but
// the layer's `glsl()` block was provided by a ProcessingNode that consumes
// `u_prevPass` (the preprocessed image).

import { GLSL_UTILS } from './glsl-utils'
import { BLEND_MODE_FUNCTIONS } from './blend-modes'
import { inspectObjectSchema } from './schema-introspection'
import type { GeneratedPass } from './types'
import type { PassPlan } from './passes'
import { EffectNode, GeneratorNode } from '@/shaders/core/node'

interface BuildContext {
  // Whether any node in the chain references a structured-UV varying (v_objectUV
  // etc.). Drives the vertex-shader variant.
  usesStructuredUv: boolean
}

export function buildFragment(plan: PassPlan, _ctx: BuildContext): GeneratedPass {
  if (plan.mode === 'js') return buildJsFragment(plan)
  return buildGlslFragment(plan)
}

function buildJsFragment(plan: PassPlan): GeneratedPass {
  const node = plan.nodes[0]
  const prefix = node.prefix
  const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_${prefix}_jsOutput;
uniform float u_${prefix}_opacity;

void main() {
  vec4 c = texture(u_${prefix}_jsOutput, v_uv);
  fragColor = vec4(c.rgb, c.a * u_${prefix}_opacity);
}
`
  return {
    fragmentShader,
    readsPrevPass: false,
    nodeIds: [node.id],
    mode: 'js',
  }
}

function buildGlslFragment(plan: PassPlan): GeneratedPass {
  const { nodes, readsPrevPass, mode } = plan
  const dependencies = new Set<string>()
  const blendModes = new Set<string>()

  // Collect dependencies and blend modes.
  for (const node of nodes) {
    const block = getGlslBlock(node)
    if (!block) continue
    block.dependencies?.forEach((d) => dependencies.add(d))
    if (node.blendMode !== 'normal') blendModes.add(node.blendMode)
  }
  blendModes.add('normal')
  for (const mode of blendModes) {
    const fn = BLEND_MODE_FUNCTIONS[mode as keyof typeof BLEND_MODE_FUNCTIONS]
    if (fn) dependencies.add(fn)
  }

  // Implicit dependency expansion (mirrors the legacy generator).
  if (dependencies.has('fbm')) dependencies.add('simplex2D')
  if (dependencies.has('snoise')) dependencies.add('simplex2D')
  if (dependencies.has('valueNoise')) dependencies.add('hash21')
  if (dependencies.has('fiberNoise')) dependencies.add('rotate')
  if (dependencies.has('domainWarp')) dependencies.add('pi')
  if (dependencies.has('oklchTransforms')) dependencies.add('pi')
  if (dependencies.has('oklchColorRampLookup')) {
    dependencies.add('oklchTransforms')
    dependencies.add('pi')
  }

  // Uniform declarations.
  const uniformDeclarations: string[] = [
    'uniform float u_time;',
    'uniform vec2 u_resolution;',
    // Always declared. The runtime binds the global noise texture to TEXTURE15.
    // Programs that never sample u_noiseTexture pay no cost — the binding is
    // a single texture-unit no-op when the location resolves to null.
    'uniform sampler2D u_noiseTexture;',
  ]
  if (readsPrevPass) {
    uniformDeclarations.push('uniform sampler2D u_prevPass;')
  }

  for (const node of nodes) {
    const prefix = node.prefix
    uniformDeclarations.push(`uniform float u_${prefix}_opacity;`)

    const cls = node.cls
    const cfgFields = inspectObjectSchema(cls.config)
    const inFields = inspectObjectSchema(cls.inputs)

    for (const field of [...cfgFields, ...inFields]) {
      const baseName = `u_${prefix}_${field.key}`
      if (field.glslType === 'sampler2D') {
        uniformDeclarations.push(`uniform sampler2D ${baseName};`)
        uniformDeclarations.push(`uniform vec4 ${baseName}_meta;`)
        uniformDeclarations.push(`uniform vec2 ${baseName}_offset;`)
      } else if (field.glslType === 'vec4Array') {
        const len = field.arrayLength ?? 10
        uniformDeclarations.push(`uniform vec4 ${baseName}[${len}];`)
        uniformDeclarations.push(`uniform int ${baseName}_count;`)
      } else {
        uniformDeclarations.push(`uniform ${field.glslType} ${baseName};`)
      }
    }
  }

  // Utility functions.
  const sortedDeps = sortDependencies(Array.from(dependencies))
  const utilFunctions: string[] = []
  for (const dep of sortedDeps) {
    if (GLSL_UTILS[dep]) utilFunctions.push(GLSL_UTILS[dep])
  }

  // Per-node helper functions and main() wrappers.
  const layerHelpers = new Set<string>()
  const layerFunctions: string[] = []
  const mainCalls: string[] = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const block = getGlslBlock(node)
    if (!block) continue
    if (block.functions) layerHelpers.add(block.functions.trim())

    const prefix = node.prefix
    const funcName = `layer_${prefix}`
    // The wrapper parameter is always named `base` so primitives can read
    // the running color (or the previous pass output, for effects) with the
    // same identifier regardless of node class. EffectNodes additionally
    // have `u_prevPass` available if they need texture-space sampling.
    layerFunctions.push(`
vec4 ${funcName}(vec2 uv, vec4 base) {
${indent(block.main.trim(), 2)}
}`)

    const blendFunc =
      BLEND_MODE_FUNCTIONS[node.blendMode] || 'blendNormal'
    if (i === 0) {
      mainCalls.push(`  vec4 color = ${funcName}(uv, vec4(0.0));`)
    } else {
      mainCalls.push(
        `  color = ${blendFunc}(color, ${funcName}(uv, color), u_${prefix}_opacity);`,
      )
    }
  }

  // Apply the first node's opacity at the end.
  if (nodes.length > 0) {
    const firstPrefix = nodes[0].prefix
    mainCalls.push(`  color.a *= u_${firstPrefix}_opacity;`)
  }

  // Scan the emitted body for which structured-UV varyings are referenced,
  // and declare only those. The vertex shader auto-detects the same set
  // (see fragment-source scan in vertex.ts) so no varying mismatch can occur.
  const body = [
    utilFunctions.join('\n'),
    Array.from(layerHelpers).join('\n'),
    layerFunctions.join('\n'),
    mainCalls.join('\n'),
  ].join('\n')
  const varyingDeclarations = collectVaryings(body)

  const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
${varyingDeclarations}
out vec4 fragColor;

// Uniforms
${uniformDeclarations.join('\n')}

// Utility Functions
${utilFunctions.join('\n')}

// Layer Helpers
${Array.from(layerHelpers).join('\n')}

// Layer Functions
${layerFunctions.join('\n')}

void main() {
  vec2 uv = v_uv;

${mainCalls.length > 0 ? mainCalls.join('\n') : '  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);'}

  fragColor = color;
}
`

  return {
    fragmentShader,
    readsPrevPass,
    nodeIds: nodes.map((n) => n.id),
    ...(mode ? { mode } : {}),
  }
}

function getGlslBlock(node: import('@/shaders/core/node').Node) {
  if (node instanceof GeneratorNode || node instanceof EffectNode) {
    return node.glsl()
  }
  // ProcessingNode in glsl-render phase.
  const proc = node as unknown as { glsl?: () => ReturnType<GeneratorNode['glsl']> }
  return proc.glsl ? proc.glsl() : null
}

function indent(code: string, spaces: number): string {
  const pad = ' '.repeat(spaces)
  return code
    .split('\n')
    .map((line) => pad + line)
    .join('\n')
}

const STRUCTURED_VARYINGS = [
  'v_objectUV',
  'v_objectBoxSize',
  'v_responsiveUV',
  'v_responsiveBoxGivenSize',
  'v_patternUV',
  'v_patternBoxSize',
  'v_imageUV',
] as const

function collectVaryings(body: string): string {
  const lines: string[] = []
  for (const v of STRUCTURED_VARYINGS) {
    if (body.includes(v)) lines.push(`in vec2 ${v};`)
  }
  return lines.join('\n')
}

const DEP_ORDER: Record<string, number> = {
  hash: 0, hash2: 0, hash3: 0, pi: 0, remap: 0, rotate: 0, rotate2D: 0,
  rgb2hsv: 0, hsv2rgb: 0, hash21: 0, hash22: 0,
  valueNoise: 1, simplex2D: 1,
  fbm: 2, fiberNoise: 2, domainWarp: 2, voronoi: 2, snoise: 2, oklchTransforms: 2,
  oklchColorRampLookup: 3,
  luma: 0, colorBandingFix: 3, gaussian9: 4,
  blendNormal: 3, blendAdd: 3, blendMultiply: 3, blendScreen: 3,
  blendOverlay: 3, blendSoftLight: 3, blendHardLight: 3,
}

function sortDependencies(deps: string[]): string[] {
  return deps.sort((a, b) => (DEP_ORDER[a] ?? 99) - (DEP_ORDER[b] ?? 99))
}
