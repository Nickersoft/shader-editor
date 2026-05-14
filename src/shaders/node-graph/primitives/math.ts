// Math — scalar math node mirroring Blender's Math. The `op` config selects
// the function; pin shape is op-dependent — unary ops expose only `x`, binary
// ops expose `a` and `b`, ternary ops add a third pin whose label tracks the
// operation (t for mix/smoothstep, ε for compare, k for smooth-min/max).

import { z } from "zod";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";
import type { PinSpec } from "../types";
import { withMeta } from "@/shaders/core/schemas";

// Mirrors Blender's grouping: trig / rounding / comparison / conversion.
const UNARY_OPS = [
  // trig
  "sin",
  "cos",
  "tan",
  "arcsine",
  "arccosine",
  "arctangent",
  // unary utility
  "abs",
  "neg",
  "oneminus",
  "sign",
  "sqrt",
  "inverse-sqrt",
  "exp",
  "log",
  // rounding
  "floor",
  "ceil",
  "round",
  "trunc",
  "fract",
  // conversion
  "to-radians",
  "to-degrees",
] as const;

const BINARY_OPS = [
  "add",
  "sub",
  "mul",
  "div",
  "min",
  "max",
  "pow",
  "mod",
  "step",
  "atan2",
  // comparison (Blender's "Less Than" / "Greater Than" outputs 0/1)
  "less-than",
  "greater-than",
] as const;

const TERNARY_OPS = [
  "mix",
  "smoothstep",
  "compare",
  "smooth-min",
  "smooth-max",
] as const;

const OPS = [...UNARY_OPS, ...BINARY_OPS, ...TERNARY_OPS] as const;
type Op = (typeof OPS)[number];

const OP_LABEL: Record<Op, string> = {
  sin: "Sine",
  cos: "Cosine",
  tan: "Tangent",
  arcsine: "Arcsine",
  arccosine: "Arccosine",
  arctangent: "Arctangent",
  abs: "Absolute",
  neg: "Negate",
  oneminus: "One Minus",
  sign: "Sign",
  sqrt: "Square Root",
  "inverse-sqrt": "Inverse Square Root",
  exp: "Exponent",
  log: "Logarithm",
  floor: "Floor",
  ceil: "Ceil",
  round: "Round",
  trunc: "Truncate",
  fract: "Fraction",
  "to-radians": "To Radians",
  "to-degrees": "To Degrees",
  add: "Add",
  sub: "Subtract",
  mul: "Multiply",
  div: "Divide",
  min: "Minimum",
  max: "Maximum",
  pow: "Power",
  mod: "Modulo",
  step: "Step",
  atan2: "Arctangent 2",
  "less-than": "Less Than",
  "greater-than": "Greater Than",
  mix: "Mix",
  smoothstep: "Smoothstep",
  compare: "Compare",
  "smooth-min": "Smooth Minimum",
  "smooth-max": "Smooth Maximum",
};

const OP_GLYPH: Record<Op, string> = {
  sin: "sin",
  cos: "cos",
  tan: "tan",
  arcsine: "sin⁻¹",
  arccosine: "cos⁻¹",
  arctangent: "tan⁻¹",
  abs: "|x|",
  neg: "−x",
  oneminus: "1−x",
  sign: "±",
  sqrt: "√",
  "inverse-sqrt": "1/√",
  exp: "eˣ",
  log: "ln",
  floor: "⌊x⌋",
  ceil: "⌈x⌉",
  round: "⌊x⌉",
  trunc: "tr",
  fract: "{x}",
  "to-radians": "→ rad",
  "to-degrees": "→ deg",
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
  min: "min",
  max: "max",
  pow: "xⁿ",
  mod: "mod",
  step: "↤",
  atan2: "atan2",
  "less-than": "<",
  "greater-than": ">",
  mix: "mix",
  smoothstep: "∫",
  compare: "≈",
  "smooth-min": "smin",
  "smooth-max": "smax",
};

const config = z.object({
  op: withMeta(z.enum(OPS), { enumLabels: OP_LABEL }).default("add"),
});

type Config = z.infer<typeof config>;

const X_PIN: PinSpec = { id: "x", type: "float", label: "X", default: 0 };
const A_PIN: PinSpec = { id: "a", type: "float", label: "A", default: 0 };
const B_PIN: PinSpec = { id: "b", type: "float", label: "B", default: 0 };
const OUT_PIN: PinSpec = { id: "out", type: "float", label: "Out" };

// Per-op shape of the third pin. Default value mirrors Blender's slider
// defaults so dropping a fresh node yields a sensible result.
const C_PIN_FOR: Record<(typeof TERNARY_OPS)[number], PinSpec> = {
  mix: { id: "c", type: "float", label: "T", default: 0.5 },
  smoothstep: { id: "c", type: "float", label: "X", default: 0.5 },
  compare: { id: "c", type: "float", label: "Epsilon", default: 0.0001 },
  "smooth-min": { id: "c", type: "float", label: "K", default: 1 },
  "smooth-max": { id: "c", type: "float", label: "K", default: 1 },
};

function isUnary(op: Op): op is (typeof UNARY_OPS)[number] {
  return (UNARY_OPS as readonly string[]).includes(op);
}

function isTernary(op: Op): op is (typeof TERNARY_OPS)[number] {
  return (TERNARY_OPS as readonly string[]).includes(op);
}

class Math extends BasePrimitive<Config> {
  static readonly typeId = "math";
  static readonly meta: PrimitiveMeta = {
    name: "Math",
    category: "converter",
    color: "#a78bfa",
    description: "Scalar math — unary, binary, and ternary ops mirroring Blender's Math node.",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const op = this.cfg(cfg).op;
    if (isUnary(op)) return [X_PIN];
    if (isTernary(op)) return [A_PIN, B_PIN, C_PIN_FOR[op]];
    return [A_PIN, B_PIN];
  }

  outputs(_cfg: Record<string, unknown>): readonly PinSpec[] {
    return [OUT_PIN];
  }

  displayTitle(cfg: Record<string, unknown>): string {
    return OP_LABEL[this.cfg(cfg).op] ?? "Math";
  }

  glyph(cfg: Record<string, unknown>): string | undefined {
    return OP_GLYPH[this.cfg(cfg).op];
  }

  emit(ctx: EmitContext): EmitResult {
    const c = this.cfg(ctx.config);
    const o = ctx.outputs.out;
    if (isUnary(c.op)) {
      return { statements: `float ${o} = ${unaryExpr(c.op, ctx.inputs.x)};` };
    }
    if (isTernary(c.op)) {
      return {
        statements: `float ${o} = ${ternaryExpr(c.op, ctx.inputs.a, ctx.inputs.b, ctx.inputs.c)};`,
      };
    }
    return { statements: `float ${o} = ${binaryExpr(c.op, ctx.inputs.a, ctx.inputs.b)};` };
  }
}

export default register(Math);

function unaryExpr(op: (typeof UNARY_OPS)[number], x: string): string {
  switch (op) {
    case "sin": return `sin(${x})`;
    case "cos": return `cos(${x})`;
    case "tan": return `tan(${x})`;
    case "arcsine": return `asin(clamp(${x}, -1.0, 1.0))`;
    case "arccosine": return `acos(clamp(${x}, -1.0, 1.0))`;
    case "arctangent": return `atan(${x})`;
    case "abs": return `abs(${x})`;
    case "neg": return `-(${x})`;
    case "oneminus": return `(1.0 - ${x})`;
    case "sign": return `sign(${x})`;
    case "sqrt": return `sqrt(max(${x}, 0.0))`;
    case "inverse-sqrt": return `inversesqrt(max(${x}, 1e-6))`;
    case "exp": return `exp(${x})`;
    case "log": return `log(max(${x}, 1e-6))`;
    case "floor": return `floor(${x})`;
    case "ceil": return `ceil(${x})`;
    case "round": return `floor(${x} + 0.5)`;
    case "trunc": return `trunc(${x})`;
    case "fract": return `fract(${x})`;
    case "to-radians": return `(${x} * 0.01745329252)`;
    case "to-degrees": return `(${x} * 57.29577951)`;
  }
}

function binaryExpr(op: (typeof BINARY_OPS)[number], a: string, b: string): string {
  switch (op) {
    case "add": return `(${a} + ${b})`;
    case "sub": return `(${a} - ${b})`;
    case "mul": return `(${a} * ${b})`;
    // Safe divide: protect against /0 while preserving sign of b. The
    // `sign(b + 1e-30)` keeps the result's sign consistent with the
    // operand even when b is exactly zero.
    case "div": return `(${a} / max(abs(${b}), 1e-6) * sign(${b} + 1e-30))`;
    case "min": return `min(${a}, ${b})`;
    case "max": return `max(${a}, ${b})`;
    case "pow": return `pow(max(${a}, 0.0), ${b})`;
    case "mod": return `mod(${a}, ${b})`;
    case "step": return `step(${a}, ${b})`;
    case "atan2": return `atan(${a}, ${b})`;
    case "less-than": return `(${a} < ${b} ? 1.0 : 0.0)`;
    case "greater-than": return `(${a} > ${b} ? 1.0 : 0.0)`;
  }
}

function ternaryExpr(op: (typeof TERNARY_OPS)[number], a: string, b: string, c: string): string {
  switch (op) {
    case "mix": return `mix(${a}, ${b}, ${c})`;
    // smoothstep(edge0=a, edge1=b, x=c) — Blender's argument order.
    case "smoothstep": return `smoothstep(${a}, ${b}, ${c})`;
    case "compare": return `(abs(${a} - ${b}) <= ${c} ? 1.0 : 0.0)`;
    // Polynomial smooth-min / smooth-max. `c` is the smoothness "k"
    // (0 = sharp min/max, larger = wider blend).
    case "smooth-min":
      return `(min(${a}, ${b}) - max(${c}, 1e-6) * 0.25 * pow(max(0.0, 1.0 - abs(${a} - ${b}) / max(${c}, 1e-6)), 2.0))`;
    case "smooth-max":
      return `(max(${a}, ${b}) + max(${c}, 1e-6) * 0.25 * pow(max(0.0, 1.0 - abs(${a} - ${b}) / max(${c}, 1e-6)), 2.0))`;
  }
}
