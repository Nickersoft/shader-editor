// Implicit pin coercion — the single source of truth for both the editor's
// connection validator and the GLSL emitter. Inspired by Blender's drag-a-
// float-into-a-vector behaviour: a connection between mismatched pin types
// is permitted if there is a canonical conversion, and that same conversion
// is emitted into the GLSL.
//
// Subtypes participate: a vec3 marked `color` collapses to luminance, a vec3
// marked `vector` collapses to length. Where the subtype makes the collapse
// ambiguous (a uv vec2 cannot meaningfully become a float), the conversion
// is rejected.

import type { PinSpec, PinType } from "./types";

export interface CoerceResult {
  /** Whether the conversion is defined. */
  ok: boolean;
  /** GLSL expression to substitute. Equals the input expr when from===to. */
  expr: string;
}

const OK = (expr: string): CoerceResult => ({ ok: true, expr });
const REJECT: CoerceResult = { ok: false, expr: "" };

/**
 * Coerce `expr` (whose type/subtype matches `from`) into a value matching
 * `to`. Returns a wrapped GLSL expression and an ok flag. The function is
 * pure — no dependencies recorded, no helper functions emitted — because the
 * coercion shims here are all inline GLSL.
 */
export function coerce(expr: string, from: PinSpec, to: PinSpec): CoerceResult {
  if (from.type === to.type) return OK(expr);

  const ft = from.type;
  const tt = to.type;

  // Scalar broadcasts.
  if (ft === "float") {
    if (tt === "vec2") return OK(`vec2(${expr})`);
    if (tt === "vec3") return OK(`vec3(${expr})`);
    if (tt === "vec4") return OK(`vec4(${expr})`);
  }

  // Bool / int promotions.
  if (ft === "bool") {
    if (tt === "float") return OK(`(${expr} ? 1.0 : 0.0)`);
    if (tt === "int") return OK(`(${expr} ? 1 : 0)`);
  }
  if (ft === "int" && tt === "float") return OK(`float(${expr})`);

  // Vector promotions / restrictions.
  if (ft === "vec2" && tt === "vec3") return OK(`vec3(${expr}, 0.0)`);
  if (ft === "vec3" && tt === "vec4") return OK(`vec4(${expr}, 1.0)`);
  if (ft === "vec4" && tt === "vec3") return OK(`${expr}.rgb`);

  // Vec3 collapse to float: subtype decides between luminance and length.
  if (ft === "vec3" && tt === "float") {
    if (from.subtype === "uv") return REJECT;
    if (from.subtype === "vector") return OK(`length(${expr})`);
    return OK(`dot(${expr}, vec3(0.2126, 0.7152, 0.0722))`);
  }

  return REJECT;
}

/**
 * Convenience: ask whether two pins can be connected. Mirrors `coerce(...).ok`
 * but takes the same shape the editor's connection callback uses.
 */
export function canCoerce(from: PinSpec, to: PinSpec): boolean {
  if (from.type === to.type) return true;
  return coerce("__probe__", from, to).ok;
}

/**
 * Compatibility helper for old call sites that only carried PinType. Falls
 * back to a default-subtype check; subtype-sensitive callers should pass
 * full PinSpecs instead.
 */
export function canCoerceType(from: PinType, to: PinType): boolean {
  const a: PinSpec = { id: "", type: from };
  const b: PinSpec = { id: "", type: to };
  return canCoerce(a, b);
}
