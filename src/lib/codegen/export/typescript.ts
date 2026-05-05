// Emits a TypeScript interface for the generated shader's React/Vanilla
// props — one field per non-runtime uniform, typed by the uniform's GLSL type.

import type { GeneratedUniform } from '../types'

export function generateTypeScript(
  uniforms: GeneratedUniform[],
  shaderName: string,
): string {
  const props = exportable(uniforms)
  const names = computePropNames(props)
  const lines: string[] = []
  lines.push(`export interface ${shaderName}Props {`)
  for (const u of props) {
    const propName = names.get(u.name)!
    const tsType = uniformTsType(u)
    lines.push(`  /** ${u.layerName} · ${u.originalName} */`)
    lines.push(`  ${propName}?: ${tsType}`)
  }
  lines.push('  /** Resolution multiplier; default 1. */')
  lines.push('  pixelRatio?: number')
  lines.push('  /** Initial time offset (seconds); default 0. */')
  lines.push('  startTime?: number')
  lines.push('  /** Wraps the canvas; default block-level. */')
  lines.push('  className?: string')
  lines.push('  style?: React.CSSProperties')
  lines.push('}')
  return lines.join('\n') + '\n'
}

export function exportable(uniforms: GeneratedUniform[]): GeneratedUniform[] {
  return uniforms.filter(
    (u) => u.name !== 'u_time' && u.name !== 'u_resolution' && !u.name.endsWith('_jsOutput'),
  )
}

/**
 * Builds friendly prop names from `<layerName><Index?><OriginalName>`.
 * The codegen's internal GLSL uniform names embed the random instance id
 * (`u_circlemoxyz123_radius`) which is unreadable in an exported API. This
 * walker assigns one friendly slug per layer-instance and disambiguates
 * duplicates with a 1-based index (`circle.radius` for the first Circle in
 * the chain, `circle2.radius` for the second).
 *
 * Returns a Map keyed by `GeneratedUniform.name` so emitters can look up the
 * external prop name without re-deriving it.
 */
export function computePropNames(
  uniforms: GeneratedUniform[],
): Map<string, string> {
  const out = new Map<string, string>()
  // First pass: count instances of each layerName so we know whether to suffix.
  const layerNameCount = new Map<string, number>()
  const seenLayers = new Set<string>()
  // We can't tell node identity from GeneratedUniform alone, but uniforms for
  // the same node share the same `<u_prefix>` extracted from `u.name`. Group
  // by that prefix.
  const prefixToLayer = new Map<string, string>()
  const prefixOrder: string[] = []
  for (const u of uniforms) {
    const prefix = extractPrefix(u.name)
    if (!prefixToLayer.has(prefix)) {
      prefixToLayer.set(prefix, u.layerName)
      prefixOrder.push(prefix)
      layerNameCount.set(u.layerName, (layerNameCount.get(u.layerName) ?? 0) + 1)
    }
  }
  // Second pass: assign suffix per occurrence.
  const usedSuffix = new Map<string, number>()
  const prefixToSlug = new Map<string, string>()
  for (const prefix of prefixOrder) {
    const layerName = prefixToLayer.get(prefix)!
    const total = layerNameCount.get(layerName) ?? 1
    const used = (usedSuffix.get(layerName) ?? 0) + 1
    usedSuffix.set(layerName, used)
    const base = camelCase(layerName)
    const slug = total > 1 ? `${base}${used}` : base
    prefixToSlug.set(prefix, slug)
  }
  for (const u of uniforms) {
    const prefix = extractPrefix(u.name)
    const slug = prefixToSlug.get(prefix)!
    out.set(u.name, slug + capitalize(u.originalName))
  }
  void seenLayers
  return out
}

function extractPrefix(uniformName: string): string {
  // `u_<prefix>_<originalName>` → `<prefix>`. Take everything between the
  // leading `u_` and the LAST underscore (since originalName can contain
  // letters but never an underscore in practice — Zod field keys are camelCase).
  const stripped = uniformName.replace(/^u_/, '')
  const lastUnderscore = stripped.lastIndexOf('_')
  return lastUnderscore >= 0 ? stripped.slice(0, lastUnderscore) : stripped
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function uniformTsType(u: GeneratedUniform): string {
  switch (u.type) {
    case 'float':
      return 'number'
    case 'int':
      return 'number'
    case 'bool':
      return 'boolean'
    case 'vec2':
      return '[number, number]'
    case 'vec3':
      return '[number, number, number]'
    case 'vec4':
      return '[number, number, number, number]'
    case 'sampler2D':
      return 'string | { url?: string | null; fit?: "cover" | "contain" | "fill"; scale?: number; rotation?: number; offsetX?: number; offsetY?: number } | null'
    case 'vec4Array':
      return 'number[][]'
  }
}

export function camelCase(s: string): string {
  // Preserve word boundaries: "Mesh Spots Gradient" → "meshSpotsGradient".
  const parts = s
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return ''
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join('')
  )
}
