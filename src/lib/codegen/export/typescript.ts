// Emits a TypeScript interface for the generated shader's React/Vanilla
// props — one field per non-runtime uniform, typed by the uniform's GLSL type.

import type { GeneratedUniform } from '../types'
import { exportable } from './vanilla'

export { exportable }

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


/**
 * Builds friendly prop names from each uniform's slug prefix + original key.
 * The codegen now assigns human-readable slug prefixes (e.g. `u_voronoi_colorA`,
 * `u_circle2_radius`), so this is a trivial mapper: extract the prefix and
 * append the capitalized field key (`voronoiColorA`, `circle2Radius`).
 */
export function computePropNames(
  uniforms: GeneratedUniform[],
): Map<string, string> {
  const out = new Map<string, string>()
  for (const u of uniforms) {
    out.set(u.name, extractPrefix(u.name) + capitalize(u.originalName))
  }
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

