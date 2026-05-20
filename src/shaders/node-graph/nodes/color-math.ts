// ColorMath — vec3 colour ops. Pin shape depends on `op`:
//
//   abs / oneminus / neg / sqrt  | (vec3) → vec3
//   add / sub / mul / div / min / max
//                                | (vec3, vec3) → vec3
//   scale / addScalar / powScalar
//                                | (vec3, float) → vec3   (float broadcast)
//   dot                          | (vec3, vec3) → float
//   luminance                    | (vec3) → float         (Rec.601 weights)
//
// Designed to keep adjustment graphs (brightness, gamma, invert, grayscale, …)
// short without introducing a separate primitive per op. Cousin of `math` and
// `vector-math`; sized to the colour-space arithmetic adjustments need.

import { z } from "zod";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";
import type { PinSpec } from "../types";
import { withMeta } from "@/shaders/core/schemas";

const OPS = [
  "abs",
  "oneminus",
  "neg",
  "sqrt",
  "floor",
  "fract",
  "add",
  "sub",
  "mul",
  "div",
  "min",
  "max",
  "scale",
  "addScalar",
  "powScalar",
  "dot",
  "luminance",
] as const;

type Op = (typeof OPS)[number];

const OP_LABEL: Record<Op, string> = {
  abs: "Absolute",
  oneminus: "One Minus",
  neg: "Negate",
  sqrt: "Square Root",
  floor: "Floor",
  fract: "Fraction",
  add: "Add",
  sub: "Subtract",
  mul: "Multiply",
  div: "Divide",
  min: "Minimum",
  max: "Maximum",
  scale: "Scale (× float)",
  addScalar: "Add Scalar",
  powScalar: "Power (Scalar)",
  dot: "Dot Product",
  luminance: "Luminance",
};

const config = z.object({
  op: withMeta(z.enum(OPS), { enumLabels: OP_LABEL }).default("add"),
});

type Config = z.infer<typeof config>;

const A_VEC3: PinSpec = { id: "a", type: "vec3", label: "A", default: [0, 0, 0], subtype: "color" };
const B_VEC3: PinSpec = { id: "b", type: "vec3", label: "B", default: [0, 0, 0], subtype: "color" };
const B_FLOAT: PinSpec = { id: "b", type: "float", label: "B", default: 1 };

const OUT_VEC3: PinSpec = { id: "out", type: "vec3", label: "Out", subtype: "color" };
const OUT_FLOAT: PinSpec = { id: "out", type: "float", label: "Out" };

function pinsFor(op: Op): { in: readonly PinSpec[]; out: readonly PinSpec[] } {
  switch (op) {
    case "abs":
    case "oneminus":
    case "neg":
    case "sqrt":
    case "floor":
    case "fract":
      return { in: [A_VEC3], out: [OUT_VEC3] };
    case "add":
    case "sub":
    case "mul":
    case "div":
    case "min":
    case "max":
      return { in: [A_VEC3, B_VEC3], out: [OUT_VEC3] };
    case "scale":
    case "addScalar":
    case "powScalar":
      return { in: [A_VEC3, B_FLOAT], out: [OUT_VEC3] };
    case "dot":
      return { in: [A_VEC3, B_VEC3], out: [OUT_FLOAT] };
    case "luminance":
      return { in: [A_VEC3], out: [OUT_FLOAT] };
  }
}

const OP_GLYPH: Record<Op, string> = {
  abs: "|c|",
  oneminus: "1−c",
  neg: "−c",
  sqrt: "√",
  floor: "⌊c⌋",
  fract: "{c}",
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
  min: "min",
  max: "max",
  scale: "× s",
  addScalar: "+ s",
  powScalar: "cˢ",
  dot: "·",
  luminance: "Y",
};

export class ColorMath extends BaseNode<Config> {
  static readonly typeId = "color-math";
  static readonly meta: NodeMeta = {
    name: "Color Math",
    category: "color",
    color: "#f59e0b",
    description: "vec3 colour ops — add/sub/mul/min/max/scale/pow/dot/luminance/...",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    return pinsFor(this.cfg(cfg).op).in;
  }

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    return pinsFor(this.cfg(cfg).op).out;
  }

  displayTitle(cfg: Record<string, unknown>): string {
    return OP_LABEL[this.cfg(cfg).op] ?? "Color Math";
  }

  glyph(cfg: Record<string, unknown>): string | undefined {
    return OP_GLYPH[this.cfg(cfg).op];
  }

  emit(ctx: EmitContext): EmitResult {
    const c = this.cfg(ctx.config);
    const a = ctx.inputs.a;
    const b = ctx.inputs.b;
    const o = ctx.outputs.out;
    switch (c.op) {
      case "abs":
        return { statements: `vec3 ${o} = abs(${a});` };
      case "oneminus":
        return { statements: `vec3 ${o} = vec3(1.0) - ${a};` };
      case "neg":
        return { statements: `vec3 ${o} = -${a};` };
      case "sqrt":
        return { statements: `vec3 ${o} = sqrt(max(${a}, vec3(0.0)));` };
      case "floor":
        return { statements: `vec3 ${o} = floor(${a});` };
      case "fract":
        return { statements: `vec3 ${o} = fract(${a});` };
      case "add":
        return { statements: `vec3 ${o} = ${a} + ${b};` };
      case "sub":
        return { statements: `vec3 ${o} = ${a} - ${b};` };
      case "mul":
        return { statements: `vec3 ${o} = ${a} * ${b};` };
      case "div":
        return { statements: `vec3 ${o} = ${a} / max(abs(${b}), vec3(1e-6));` };
      case "min":
        return { statements: `vec3 ${o} = min(${a}, ${b});` };
      case "max":
        return { statements: `vec3 ${o} = max(${a}, ${b});` };
      case "scale":
        return { statements: `vec3 ${o} = ${a} * ${b};` };
      case "addScalar":
        return { statements: `vec3 ${o} = ${a} + ${b};` };
      case "powScalar":
        return { statements: `vec3 ${o} = pow(max(${a}, vec3(0.0)), vec3(${b}));` };
      case "dot":
        return { statements: `float ${o} = dot(${a}, ${b});` };
      case "luminance":
        return { statements: `float ${o} = dot(${a}, vec3(0.299, 0.587, 0.114));` };
    }
  }
}

export default register(ColorMath);
