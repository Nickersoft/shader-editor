// Pin handle colours and category palette. Mirrors Blender's shader-node
// convention where the socket colour communicates the pin's role at a glance
// without needing a label.
//
// Both `(type, subtype)` participate so the same vec3 GLSL type renders
// yellow when it carries `subtype: "color"` and purple when it carries
// `subtype: "vector"`. Same emission, different role, different colour.

import type { PinSpec, PinType } from "@/shaders/node-graph";

const COLOR_SCALAR = "#9ca3af"; //        grey   — float / int
const COLOR_BOOL = "#ec4899"; //          pink   — boolean
const COLOR_VECTOR = "#8b5cf6"; //        purple — geometric vector / UV
const COLOR_COLOR = "#facc15"; //         yellow — colour
const COLOR_COLOR_ALPHA = "#fb923c"; //   orange — colour with alpha (vec4 color)
const COLOR_ANGLE = "#a78bfa"; //         light-purple — angle (still a float, but distinct)

/** Resolve a pin to its handle colour. Subtype takes precedence over base type. */
export function colorForPin(pin: PinSpec): string {
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
    case "int":
      return COLOR_SCALAR;
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

/**
 * Header tint colour for primitive nodes, keyed by category. The eye groups
 * by category at a glance, so a node's colour says "I am a converter" before
 * its title says "I am a Sine". Same palette is used by the node header and
 * the minimap.
 */
export const CATEGORY_COLOR: Record<string, string> = {
  input: "#0ea5e9", //     sky
  texture: "#f59e0b", //   amber
  color: "#ec4899", //     pink
  vector: "#8b5cf6", //    violet
  converter: "#10b981", // emerald
  group: "#94a3b8", //     slate
};

export function categoryColorFor(category: string | undefined, fallback = "#888"): string {
  if (!category) return fallback;
  return CATEGORY_COLOR[category] ?? fallback;
}
