// Walks Zod schemas to extract GLSL uniform information.
//
// Each Node class declares `static config` and `static inputs` as Zod object
// schemas. The codegen iterates the shape of each, peers through wrappers
// (.optional / .default / .nullable), and emits uniform declarations.

import { z } from "zod";
import { getMetaDeep, tryUnwrap, type UiMeta } from "@/shaders/core/schemas";
import type { UniformGlType } from "./types";

/** Default fixed length for vec4Array (palette) uniforms. */
export const DEFAULT_VEC4_ARRAY_LENGTH = 10;

type MetaKind = NonNullable<UiMeta["kind"]>;

export interface InspectedField {
  key: string;
  glslType: UniformGlType;
  schema: z.ZodType;
  kind?: MetaKind;
  arrayLength?: number;
}

export interface InspectedUiField {
  key: string;
  glslType: UniformGlType | "enumString";
  schema: z.ZodType;
  kind?: MetaKind;
  arrayLength?: number;
  /** For enum strings, the allowed values. */
  enumValues?: readonly string[];
  /** Optional display labels for enum string values. */
  enumLabels?: Record<string, string>;
}

/**
 * Walk through wrapper types (`.optional()`, `.default(...)`, `.nullable()`,
 * etc.) to reach the underlying schema.
 */
export function unwrap(schema: z.ZodType): z.ZodType {
  let s = schema;
  for (let next = tryUnwrap(s); next; next = tryUnwrap(s)) {
    s = next;
  }
  return s;
}

/**
 * Infer the GLSL uniform type for a Zod schema. Returns undefined if the
 * schema isn't representable as a single GLSL uniform. Pass a precomputed
 * `meta` to avoid a redundant `getMetaDeep` walk in tight loops.
 */
export function inferGlslType(
  schema: z.ZodType,
  meta: UiMeta | undefined = getMetaDeep(schema),
): UniformGlType | undefined {
  if (meta?.kind === "image-input" || meta?.kind === "sampler2D") {
    return "sampler2D";
  }
  if (meta?.kind === "palette") return "vec4Array";

  const inner = unwrap(schema);

  if (inner instanceof z.ZodNumber) {
    return inner.format?.includes("int") ? "int" : "float";
  }
  if (inner instanceof z.ZodBoolean) return "bool";
  if (inner instanceof z.ZodTuple) {
    switch (inner.def.items.length) {
      case 2:
        return "vec2";
      case 3:
        return "vec3";
      case 4:
        return "vec4";
    }
  }
  return undefined;
}

function buildUniformField(
  key: string,
  schema: z.ZodType,
  glslType: UniformGlType,
  meta: UiMeta | undefined,
): InspectedField {
  return {
    key,
    glslType,
    schema,
    kind: meta?.kind,
    arrayLength:
      glslType === "vec4Array"
        ? (meta?.ui?.array?.maxLength ?? DEFAULT_VEC4_ARRAY_LENGTH)
        : undefined,
  };
}

/**
 * Walk a Zod object schema's shape, returning one InspectedField per top-level
 * field. Skips fields that aren't representable as uniforms.
 */
export function inspectObjectSchema(schema: z.ZodType): InspectedField[] {
  const inner = unwrap(schema);
  if (!(inner instanceof z.ZodObject)) return [];
  const out: InspectedField[] = [];
  for (const [key, fieldSchema] of Object.entries(inner.shape)) {
    const meta = getMetaDeep(fieldSchema);
    const glslType = inferGlslType(fieldSchema, meta);
    if (!glslType) continue;
    out.push(buildUniformField(key, fieldSchema, glslType, meta));
  }
  return out;
}

/**
 * Like `inspectObjectSchema` but additionally includes enum-string fields so
 * the property panel can render dropdowns for non-uniform config fields
 * (e.g. a Gradient node's `type: 'linear' | 'radial'`).
 */
export function inspectUiFields(schema: z.ZodType): InspectedUiField[] {
  const inner = unwrap(schema);
  if (!(inner instanceof z.ZodObject)) return [];
  const out: InspectedUiField[] = [];
  for (const [key, fieldSchema] of Object.entries(inner.shape)) {
    const meta = getMetaDeep(fieldSchema);
    const glslType = inferGlslType(fieldSchema, meta);
    if (glslType) {
      out.push(buildUniformField(key, fieldSchema, glslType, meta));
      continue;
    }
    const innerField = unwrap(fieldSchema);
    if (innerField instanceof z.ZodEnum) {
      out.push({
        key,
        glslType: "enumString",
        schema: fieldSchema,
        enumValues: innerField.options.filter((v): v is string => typeof v === "string"),
        enumLabels: meta?.enumLabels,
      });
    }
  }
  return out;
}
