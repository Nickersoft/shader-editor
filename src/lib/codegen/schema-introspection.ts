// Walks Zod schemas to extract GLSL uniform information.
//
// Each Node class declares `static config` and `static inputs` as Zod object
// schemas. The codegen iterates the shape of each, peers through wrappers
// (.optional / .default / .nullable), and emits uniform declarations.

import { z } from 'zod'
import { getMetaDeep } from '@/shaders/core/schemas'
import type { UniformGlType } from './types'

/** Default fixed length for vec4Array (palette) uniforms. */
export const DEFAULT_VEC4_ARRAY_LENGTH = 10

export interface InspectedField {
  key: string
  glslType: UniformGlType
  schema: z.ZodTypeAny
  // Resolved kind metadata (image-input, palette, sampler2D) if present.
  kind?: 'image-input' | 'palette' | 'sampler2D'
  // For vec4Array, the static GLSL upper bound.
  arrayLength?: number
}

/**
 * UI-only field — covers schema entries that aren't representable as GLSL
 * uniforms (e.g. enum strings) but should still appear in the property panel.
 * `glslType` is `'enumString'` for enum-valued fields.
 */
export interface InspectedUiField {
  key: string
  glslType: UniformGlType | 'enumString'
  schema: z.ZodTypeAny
  kind?: 'image-input' | 'palette' | 'sampler2D'
  arrayLength?: number
  /** For enum strings, the allowed values. */
  enumValues?: readonly string[]
}

/**
 * Walk through wrapper types (`.optional()`, `.default(...)`, `.nullable()`)
 * to reach the underlying schema. Zod 4 stores wrappers with `_def.innerType`.
 */
export function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let s: z.ZodTypeAny = schema
  while (true) {
    const def = s._def as { innerType?: z.ZodTypeAny }
    if (def.innerType) {
      s = def.innerType
      continue
    }
    return s
  }
}

/**
 * Infer the GLSL uniform type for a Zod schema. Returns undefined if the
 * schema isn't representable as a single GLSL uniform.
 */
export function inferGlslType(schema: z.ZodTypeAny): UniformGlType | undefined {
  const meta = getMetaDeep(schema)
  if (meta?.kind === 'image-input' || meta?.kind === 'sampler2D') {
    return 'sampler2D'
  }
  if (meta?.kind === 'palette') return 'vec4Array'

  const inner = unwrap(schema)
  const type = (inner._def as { type: string }).type

  if (type === 'number') {
    // Zod 4 records `.int()` as a check with `isInt === true`.
    const def = inner._def as { checks?: Array<{ isInt?: boolean }> }
    const isInt = def.checks?.some((c) => c.isInt === true)
    return isInt ? 'int' : 'float'
  }
  if (type === 'boolean') return 'bool'
  if (type === 'tuple') {
    const items = (inner._def as unknown as { items: z.ZodTypeAny[] }).items
    if (items.length === 2) return 'vec2'
    if (items.length === 3) return 'vec3'
    if (items.length === 4) return 'vec4'
  }
  return undefined
}

/**
 * Walk a Zod object schema's shape, returning one InspectedField per top-level
 * field. Skips fields that aren't representable as uniforms.
 */
export function inspectObjectSchema(schema: z.ZodTypeAny): InspectedField[] {
  const inner = unwrap(schema)
  if (!(inner instanceof z.ZodObject)) return []
  const shape = inner.shape as Record<string, z.ZodTypeAny>
  const out: InspectedField[] = []
  for (const [key, fieldSchema] of Object.entries(shape)) {
    const glslType = inferGlslType(fieldSchema)
    if (!glslType) continue
    const meta = getMetaDeep(fieldSchema)
    out.push({
      key,
      glslType,
      schema: fieldSchema,
      kind: meta?.kind,
      arrayLength:
        glslType === 'vec4Array'
          ? meta?.ui?.array?.maxLength ?? DEFAULT_VEC4_ARRAY_LENGTH
          : undefined,
    })
  }
  return out
}

/**
 * Like `inspectObjectSchema` but additionally includes enum-string fields so
 * the property panel can render dropdowns for non-uniform config fields
 * (e.g. a Gradient node's `type: 'linear' | 'radial'`).
 */
export function inspectUiFields(schema: z.ZodTypeAny): InspectedUiField[] {
  const inner = unwrap(schema)
  if (!(inner instanceof z.ZodObject)) return []
  const shape = inner.shape as Record<string, z.ZodTypeAny>
  const out: InspectedUiField[] = []
  for (const [key, fieldSchema] of Object.entries(shape)) {
    const glslType = inferGlslType(fieldSchema)
    if (glslType) {
      const meta = getMetaDeep(fieldSchema)
      out.push({
        key,
        glslType,
        schema: fieldSchema,
        kind: meta?.kind,
        arrayLength:
          glslType === 'vec4Array'
            ? meta?.ui?.array?.maxLength ?? DEFAULT_VEC4_ARRAY_LENGTH
            : undefined,
      })
      continue
    }
    const innerField = unwrap(fieldSchema)
    const t = (innerField._def as { type?: string }).type
    if (t === 'enum') {
      const entries = (innerField._def as { entries?: Record<string, string> })
        .entries
      const values = entries ? Object.values(entries) : []
      out.push({
        key,
        glslType: 'enumString',
        schema: fieldSchema,
        enumValues: values,
      })
    }
  }
  return out
}
