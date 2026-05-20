// Pin DSL — Zod-based schema constructors for graph-topology sockets.
//
// Each helper (`float`, `vec2`, …) returns a Zod schema tagged via `.meta()`
// with the GLSL pin type and an optional display label. Primitives compose
// these into `z.object({...})` bags for `static pins.in` / `static pins.out`,
// then `BaseNode`'s default `inputs()`/`outputs()` use
// `pinSpecsFromSchema()` to project the bag back into the `PinSpec[]` shape
// the editor and emitter consume.
//
// Pin schemas are NOT validated at runtime — pins aren't user-edited state,
// they're authoring metadata. Zod is used here purely as a typed-metadata DSL
// so primitives get `keyof z.infer<typeof pinIn>` flowing into `EmitContext`
// for typed `ctx.inputs.x` access.

import { z } from "zod";
import { getMetaDeep, tryUnwrap, withMeta } from "@/shaders/core/schemas";
import { PIN_TYPES, type PinDefault, type PinSpec, type PinType } from "./types";

/**
 * Zod enum mirroring the `PinType` union. Lives here (not in types.ts) so
 * types.ts stays Zod-free and primitives that need to validate a serialised
 * pin type can import a single canonical schema rather than redeclaring the
 * enum each time.
 */
export const zPinType = z.enum(PIN_TYPES);

interface PinMetaBag {
  pinType: PinType;
  label?: string;
  /**
   * Semantic tag propagated to PinSpec.subtype. Drives the inline editor
   * (swatch vs. scrubbers) and implicit coercion choice (luminance vs.
   * length when a vec3 collapses to a float). Emit otherwise ignores it.
   */
  subtype?: "color" | "vector" | "uv" | "angle" | "channel";
}

/**
 * Tag a Zod schema with pin-specific metadata. Goes through `withMeta` so it
 * composes with any UI metadata callers chain on (rare for pins, but kept
 * symmetrical with the texture schemas helpers).
 */
function pinMeta<S extends z.ZodTypeAny>(schema: S, meta: PinMetaBag): S {
  // `withMeta` is typed for `UiMeta`; pin metadata is a separate bag. Cast the
  // outgoing schema rather than threading a generic meta type through the
  // shared helper — pin metadata is read back via `getPinMeta()` below.
  return withMeta(schema, meta as unknown as Parameters<typeof withMeta>[1]);
}

export const float = (label?: string, def = 0) =>
  pinMeta(z.number().default(def), { pinType: "float", label });

export const vec2 = (
  label?: string,
  def: readonly [number, number] = [0, 0],
) => pinMeta(z.tuple([z.number(), z.number()]).default([...def]), { pinType: "vec2", label });

export const vec3 = (
  label?: string,
  def: readonly [number, number, number] = [0, 0, 0],
) => pinMeta(z.tuple([z.number(), z.number(), z.number()]).default([...def]), { pinType: "vec3", label });

export const vec4 = (
  label?: string,
  def: readonly [number, number, number, number] = [0, 0, 0, 1],
) =>
  pinMeta(z.tuple([z.number(), z.number(), z.number(), z.number()]).default([...def]), {
    pinType: "vec4",
    label,
  });

/**
 * Colour pin (vec3 RGB). Same emission as `vec3` — `subtype: "color"` is a
 * UI-only hint that surfaces a colour swatch in the inline pin editor instead
 * of XYZ scrubbers. Default is opaque white, matching authoring expectations.
 */
export const color = (
  label?: string,
  def: readonly [number, number, number] = [1, 1, 1],
) =>
  pinMeta(z.tuple([z.number(), z.number(), z.number()]).default([...def]), {
    pinType: "vec3",
    label,
    subtype: "color",
  });

/**
 * Vector pin (vec2 or vec3). Same emission as the underlying vector type —
 * `subtype: "vector"` distinguishes geometric vectors from colours so a
 * downstream coercion to float chooses `length()` rather than luminance.
 */
export const vector2 = (
  label?: string,
  def: readonly [number, number] = [0, 0],
) =>
  pinMeta(z.tuple([z.number(), z.number()]).default([...def]), {
    pinType: "vec2",
    label,
    subtype: "vector",
  });

export const vector3 = (
  label?: string,
  def: readonly [number, number, number] = [0, 0, 0],
) =>
  pinMeta(z.tuple([z.number(), z.number(), z.number()]).default([...def]), {
    pinType: "vec3",
    label,
    subtype: "vector",
  });

/**
 * UV pin (vec2). Treated as a coordinate, not a vector — collapse to float
 * is rejected (ambiguous), promotion to vec3 pads with z=0.
 */
export const uv = (
  label?: string,
  def: readonly [number, number] = [0.5, 0.5],
) =>
  pinMeta(z.tuple([z.number(), z.number()]).default([...def]), {
    pinType: "vec2",
    label,
    subtype: "uv",
  });

/**
 * Angle pin (float, radians). Pure UI hint — the editor can render an angle
 * dial instead of a numeric scrubber. Emission identical to `float`.
 */
export const angle = (label?: string, def = 0) =>
  pinMeta(z.number().default(def), { pinType: "float", label, subtype: "angle" });

/** Colour pin with alpha (vec4 RGBA). Default opaque white. */
export const colorAlpha = (
  label?: string,
  def: readonly [number, number, number, number] = [1, 1, 1, 1],
) =>
  pinMeta(z.tuple([z.number(), z.number(), z.number(), z.number()]).default([...def]), {
    pinType: "vec4",
    label,
    subtype: "color",
  });

export const bool = (label?: string, def = false) =>
  pinMeta(z.boolean().default(def), { pinType: "bool", label });

export const int = (label?: string, def = 0) =>
  pinMeta(z.number().int().default(def), { pinType: "int", label });

/**
 * Read pin metadata off a schema, walking `.default()` / `.optional()` /
 * `.describe()` wrappers via `getMetaDeep`. Returns `undefined` if the schema
 * wasn't built with one of the pin DSL helpers.
 */
function getPinMeta(schema: z.ZodType): PinMetaBag | undefined {
  const m = getMetaDeep(schema) as unknown as PinMetaBag | undefined;
  if (!m || typeof m.pinType !== "string") return undefined;
  return m;
}

/**
 * Resolve the pin's default value by parsing `undefined` against its schema —
 * Zod's `.default(...)` wrapper hydrates the inner default in that case. If
 * the schema has no default (e.g. an output pin), returns `undefined`.
 */
function getPinDefault(schema: z.ZodType): PinDefault | undefined {
  const result = (schema as z.ZodTypeAny).safeParse(undefined);
  if (!result.success) return undefined;
  return result.data as PinDefault;
}

/**
 * Walks a `z.object({...})` of pin schemas and produces the legacy `PinSpec[]`
 * shape the emitter and editor consume. Each top-level field becomes one pin;
 * the field's key is the pin id, the schema's `pinType` meta becomes
 * `PinSpec.type`, and `.default()` becomes `PinSpec.default`.
 *
 * Schemas that aren't built with the pin DSL helpers are skipped with a
 * console warning — surfacing authoring mistakes early without breaking the
 * whole graph.
 */
export function pinSpecsFromSchema(schema: z.ZodType): PinSpec[] {
  // Walk wrappers (e.g. if a primitive ever applies `.optional()` to its pin
  // bag itself) until we reach the underlying ZodObject.
  let inner: z.ZodType = schema;
  while (!(inner instanceof z.ZodObject)) {
    const next = tryUnwrap(inner);
    if (!next) return [];
    inner = next;
  }
  const shape = (inner as z.ZodObject).shape as Record<string, z.ZodType>;
  const specs: PinSpec[] = [];
  for (const [id, field] of Object.entries(shape)) {
    const meta = getPinMeta(field);
    if (!meta) {
      console.warn(`pinSpecsFromSchema: field "${id}" missing pinType metadata; skipping`);
      continue;
    }
    specs.push({
      id,
      type: meta.pinType,
      label: meta.label,
      default: getPinDefault(field),
      ...(meta.subtype ? { subtype: meta.subtype } : {}),
    });
  }
  return specs;
}
