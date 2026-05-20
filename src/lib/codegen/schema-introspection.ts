// Walks Zod schemas to extract field information for both codegen (uniform
// declarations) and UI rendering (property panels, inline node editors).
//
// Each Node class declares `static schema` as a Zod object. This module walks
// the shape, peers through wrappers (.optional / .default / .nullable), and
// classifies each field by its GLSL uniform type — or by `"enumString"` for
// string-enum fields that branch GLSL source rather than binding as uniforms.

import { z } from "zod";
import { getMetaDeep, tryUnwrap, type UiMeta } from "@/shaders/core/schemas";
import type { UniformGlType } from "./types";

/** Default fixed length for vec4Array (palette) uniforms. */
export const DEFAULT_VEC4_ARRAY_LENGTH = 10;

export type FieldGlslType = UniformGlType | "enumString";

export interface InspectedField {
  key: string;
  glslType: FieldGlslType;
  schema: z.ZodType;
  /** Fully merged metadata across the wrapper chain; undefined if none attached. */
  meta?: UiMeta;
  /** Set for vec4Array fields — fixed GLSL array length. */
  arrayLength?: number;
  /** Set for enumString fields — allowed string values. */
  enumValues?: readonly string[];
  /** Set for enumString fields — optional display labels keyed by enum value. */
  enumLabels?: Record<string, string>;
}

/** Walk wrapper types (`.optional()`, `.default(...)`, …) to the underlying schema. */
function unwrap(schema: z.ZodType): z.ZodType {
  let s = schema;
  for (let next = tryUnwrap(s); next; next = tryUnwrap(s)) s = next;
  return s;
}

function inferGlslType(meta: UiMeta | undefined, inner: z.ZodType): UniformGlType | undefined {
  if (meta?.kind === "image-input" || meta?.kind === "sampler2D") return "sampler2D";
  if (meta?.kind === "palette") return "vec4Array";
  if (inner instanceof z.ZodNumber) return inner.format?.includes("int") ? "int" : "float";
  if (inner instanceof z.ZodBoolean) return "bool";
  if (inner instanceof z.ZodTuple) {
    switch (inner.def.items.length) {
      case 2: return "vec2";
      case 3: return "vec3";
      case 4: return "vec4";
    }
  }
  return undefined;
}

// Schemas are class-static, so inspection results are stable for the lifetime
// of a class. A WeakMap keyed by schema avoids re-walking on every render.
const fieldsCache = new WeakMap<z.ZodType, InspectedField[]>();
const EMPTY: InspectedField[] = [];

/**
 * Walk a Zod object schema's shape and return one entry per UI-relevant field
 * — both GLSL-uniform fields and string-enum fields (which render dropdowns
 * but don't bind as uniforms). Cached by schema identity.
 */
export function inspectFields(schema: z.ZodType): InspectedField[] {
  const cached = fieldsCache.get(schema);
  if (cached) return cached;

  const root = unwrap(schema);
  if (!(root instanceof z.ZodObject)) {
    fieldsCache.set(schema, EMPTY);
    return EMPTY;
  }

  const out: InspectedField[] = [];
  for (const [key, fieldSchema] of Object.entries(root.shape)) {
    const meta = getMetaDeep(fieldSchema);
    const inner = unwrap(fieldSchema);
    const glslType = inferGlslType(meta, inner);

    if (glslType) {
      out.push({
        key,
        glslType,
        schema: fieldSchema,
        meta,
        arrayLength:
          glslType === "vec4Array"
            ? (meta?.ui?.array?.maxLength ?? DEFAULT_VEC4_ARRAY_LENGTH)
            : undefined,
      });
      continue;
    }

    if (inner instanceof z.ZodEnum) {
      out.push({
        key,
        glslType: "enumString",
        schema: fieldSchema,
        meta,
        enumValues: inner.options.filter((v): v is string => typeof v === "string"),
        enumLabels: meta?.enumLabels,
      });
    }
  }

  fieldsCache.set(schema, out);
  return out;
}

/** An InspectedField narrowed to a real GLSL uniform type (no enumString). */
export type InspectedUniform = InspectedField & { glslType: UniformGlType };

/**
 * Subset of `inspectFields` that excludes enum-string fields — those branch
 * GLSL source at codegen time rather than binding as uniforms.
 */
export function inspectUniformFields(schema: z.ZodType): InspectedUniform[] {
  return inspectFields(schema).filter(
    (f): f is InspectedUniform => f.glslType !== "enumString",
  );
}
