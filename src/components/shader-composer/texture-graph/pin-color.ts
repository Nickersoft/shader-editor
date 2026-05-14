// Pin handle colours. Mirrors Blender's shader-node convention where the
// socket colour communicates the pin's role at a glance without needing a
// label: grey for plain scalars, purple for geometric vectors and UVs,
// yellow for colours, and a distinct accent for booleans.
//
// Both `(type, subtype)` participate so the same vec3 GLSL type renders
// yellow when it carries `subtype: "color"` and purple when it carries
// `subtype: "vector"`. Same emission, different role, different colour.

import type { PinSpec, PinType } from "@/shaders/node-graph";

const COLOR_SCALAR_FLOAT = "#9ca3af"; //  grey   — float
const COLOR_SCALAR_INT = "#9ca3af"; //    grey   — int (Blender treats integers as scalars)
const COLOR_BOOL = "#ec4899"; //          pink   — boolean
const COLOR_VECTOR = "#8b5cf6"; //        purple — geometric vector / UV
const COLOR_COLOR = "#facc15"; //         yellow — colour
const COLOR_COLOR_ALPHA = "#fb923c"; //   orange — colour with alpha (vec4 color)
const COLOR_ANGLE = "#a78bfa"; //         light-purple — angle (still a float, but distinct)

/**
 * Resolve a pin to its handle colour.
 *
 * For backwards compatibility the legacy `PinType`-only lookup is kept as
 * `colorForPinType`; new callers should pass the full spec so subtype
 * participates.
 */
export function colorForPin(pin: PinSpec): string {
  // Subtype takes precedence — it tells us the pin's role even when the
  // underlying GLSL type is shared with other roles.
  if (pin.subtype === "color") {
    return pin.type === "vec4" ? COLOR_COLOR_ALPHA : COLOR_COLOR;
  }
  if (pin.subtype === "vector" || pin.subtype === "uv") return COLOR_VECTOR;
  if (pin.subtype === "angle") return COLOR_ANGLE;
  return colorForPinType(pin.type);
}

/** Fallback colour by GLSL type when no subtype is available. */
export function colorForPinType(type: PinType): string {
  switch (type) {
    case "float":
      return COLOR_SCALAR_FLOAT;
    case "int":
      return COLOR_SCALAR_INT;
    case "bool":
      return COLOR_BOOL;
    case "vec2":
      return COLOR_VECTOR;
    case "vec3":
      return COLOR_COLOR;
    case "vec4":
      return COLOR_COLOR_ALPHA;
  }
}
