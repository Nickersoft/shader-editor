// VectorMath — vector operations mirroring Blender's Vector Math. A `dim`
// config selects vec2 vs. vec3, and the pin shape morphs per (op, dim):
//
//   length / dot / distance         → out is float
//   normalize / add / sub / abs /
//     neg / oneminus / sqrt /
//     floor / fract                 → out matches input dim
//   scale  (vector, float)          → out matches input dim
//   rotate-2d  (vec2, float)        → vec2 only (rotation matrix)
//   cross  (vec3, vec3)             → vec3 only
//   project / reflect / refract /
//     faceforward                   → out matches input dim
//
// Default `dim` is vec2 to preserve the semantics of saved graphs from
// before this primitive was promoted.

import { z } from "zod";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";
import type { PinSpec, PinType } from "../types";
import { withMeta } from "@/shaders/core/schemas";

const OPS = [
  // Reductions to float
  "length",
  "dot",
  "distance",
  // Same-dim transforms
  "normalize",
  "add",
  "sub",
  "abs",
  "neg",
  "oneminus",
  "sqrt",
  "floor",
  "fract",
  // Mixed-arity
  "scale",
  "rotate-2d",
  "cross",
  // Vec-vs-vec utility
  "project",
  "reflect",
  "refract",
  "faceforward",
] as const;

type Op = (typeof OPS)[number];

const OP_LABEL: Record<Op, string> = {
  length: "Length",
  dot: "Dot Product",
  distance: "Distance",
  normalize: "Normalize",
  add: "Add",
  sub: "Subtract",
  abs: "Absolute",
  neg: "Negate",
  oneminus: "One Minus",
  sqrt: "Square Root",
  floor: "Floor",
  fract: "Fraction",
  scale: "Scale",
  "rotate-2d": "Rotate 2D",
  cross: "Cross Product",
  project: "Project",
  reflect: "Reflect",
  refract: "Refract",
  faceforward: "Face Forward",
};

const OP_GLYPH: Record<Op, string> = {
  length: "‖v‖",
  dot: "·",
  distance: "↔",
  normalize: "v̂",
  add: "+",
  sub: "−",
  abs: "|v|",
  neg: "−v",
  oneminus: "1−v",
  sqrt: "√",
  floor: "⌊v⌋",
  fract: "{v}",
  scale: "× s",
  "rotate-2d": "↻",
  cross: "×",
  project: "⊥",
  reflect: "↩",
  refract: "↪",
  faceforward: "ff",
};

const config = z.object({
  op: withMeta(z.enum(OPS), { enumLabels: OP_LABEL }).default("length"),
  dim: z.enum(["vec2", "vec3"]).default("vec2"),
});

type Config = z.infer<typeof config>;

function pinsFor(op: Op, dim: PinType): { in: readonly PinSpec[]; out: readonly PinSpec[] } {
  const V_A: PinSpec = { id: "a", type: dim, label: "A", default: dim === "vec2" ? [0, 0] : [0, 0, 0], subtype: "vector" };
  const V_B: PinSpec = { id: "b", type: dim, label: "B", default: dim === "vec2" ? [0, 0] : [0, 0, 0], subtype: "vector" };
  const FLOAT_B: PinSpec = { id: "b", type: "float", label: "B", default: 1 };
  const FLOAT_OUT: PinSpec = { id: "out", type: "float", label: "Out" };
  const V_OUT: PinSpec = { id: "out", type: dim, label: "Out", subtype: "vector" };

  switch (op) {
    case "length":
      return { in: [V_A], out: [FLOAT_OUT] };
    case "dot":
    case "distance":
      return { in: [V_A, V_B], out: [FLOAT_OUT] };
    case "normalize":
    case "abs":
    case "neg":
    case "oneminus":
    case "sqrt":
    case "floor":
    case "fract":
      return { in: [V_A], out: [V_OUT] };
    case "add":
    case "sub":
    case "project":
    case "reflect":
    case "faceforward":
      return { in: [V_A, V_B], out: [V_OUT] };
    case "refract": {
      // refract(I, N, eta): a=I, b=N, c=eta (float).
      const C_ETA: PinSpec = { id: "c", type: "float", label: "η", default: 1 };
      return { in: [V_A, V_B, C_ETA], out: [V_OUT] };
    }
    case "scale":
      return { in: [V_A, FLOAT_B], out: [V_OUT] };
    case "rotate-2d": {
      // Forced vec2 regardless of dim — the rotation matrix is 2D.
      const VEC2_A: PinSpec = { id: "a", type: "vec2", label: "A", default: [0, 0], subtype: "vector" };
      const VEC2_OUT: PinSpec = { id: "out", type: "vec2", label: "Out", subtype: "vector" };
      const FLOAT_ANGLE: PinSpec = { id: "b", type: "float", label: "Angle", default: 0, subtype: "angle" };
      return { in: [VEC2_A, FLOAT_ANGLE], out: [VEC2_OUT] };
    }
    case "cross": {
      // Forced vec3 — cross product is 3D.
      const VEC3_A: PinSpec = { id: "a", type: "vec3", label: "A", default: [0, 0, 0], subtype: "vector" };
      const VEC3_B: PinSpec = { id: "b", type: "vec3", label: "B", default: [0, 0, 0], subtype: "vector" };
      const VEC3_OUT: PinSpec = { id: "out", type: "vec3", label: "Out", subtype: "vector" };
      return { in: [VEC3_A, VEC3_B], out: [VEC3_OUT] };
    }
  }
}

class VectorMath extends BasePrimitive<Config> {
  static readonly typeId = "vector-math";
  static readonly meta: PrimitiveMeta = {
    name: "Vector Math",
    category: "vector",
    color: "#a78bfa",
    description: "Vector operations — length, normalize, dot, cross, rotate, …",
  };
  static readonly config = config;

  inputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const c = this.cfg(cfg);
    return pinsFor(c.op, c.dim).in;
  }

  outputs(cfg: Record<string, unknown>): readonly PinSpec[] {
    const c = this.cfg(cfg);
    return pinsFor(c.op, c.dim).out;
  }

  displayTitle(cfg: Record<string, unknown>): string {
    return OP_LABEL[this.cfg(cfg).op] ?? "Vector Math";
  }

  glyph(cfg: Record<string, unknown>): string | undefined {
    return OP_GLYPH[this.cfg(cfg).op];
  }

  emit(ctx: EmitContext): EmitResult {
    const c = this.cfg(ctx.config);
    const a = ctx.inputs.a;
    const b = ctx.inputs.b;
    const cIn = ctx.inputs.c;
    const o = ctx.outputs.out;
    const dim = c.op === "rotate-2d" ? "vec2" : c.op === "cross" ? "vec3" : c.dim;

    switch (c.op) {
      case "length":
        return { statements: `float ${o} = length(${a});` };
      case "dot":
        return { statements: `float ${o} = dot(${a}, ${b});` };
      case "distance":
        return { statements: `float ${o} = distance(${a}, ${b});` };
      case "normalize":
        // Guard against zero-length input.
        return { statements: `${dim} ${o} = (length(${a}) > 1e-6) ? normalize(${a}) : ${zeroLit(dim)};` };
      case "add":
        return { statements: `${dim} ${o} = ${a} + ${b};` };
      case "sub":
        return { statements: `${dim} ${o} = ${a} - ${b};` };
      case "abs":
        return { statements: `${dim} ${o} = abs(${a});` };
      case "neg":
        return { statements: `${dim} ${o} = -${a};` };
      case "oneminus":
        return { statements: `${dim} ${o} = ${oneLit(dim)} - ${a};` };
      case "sqrt":
        return { statements: `${dim} ${o} = sqrt(max(${a}, ${zeroLit(dim)}));` };
      case "floor":
        return { statements: `${dim} ${o} = floor(${a});` };
      case "fract":
        return { statements: `${dim} ${o} = fract(${a});` };
      case "scale":
        return { statements: `${dim} ${o} = ${a} * ${b};` };
      case "rotate-2d":
        return {
          statements: `vec2 ${o} = mat2(cos(${b}), -sin(${b}), sin(${b}), cos(${b})) * ${a};`,
        };
      case "cross":
        return { statements: `vec3 ${o} = cross(${a}, ${b});` };
      case "project": {
        // project(a, b) = (dot(a, b) / dot(b, b)) * b — the part of `a`
        // parallel to `b`.
        return {
          statements: `${dim} ${o} = ${b} * (dot(${a}, ${b}) / max(dot(${b}, ${b}), 1e-6));`,
        };
      }
      case "reflect":
        return { statements: `${dim} ${o} = reflect(${a}, ${b});` };
      case "refract":
        return { statements: `${dim} ${o} = refract(${a}, ${b}, ${cIn});` };
      case "faceforward":
        return { statements: `${dim} ${o} = faceforward(${a}, ${b}, ${a});` };
    }
  }
}

export default register(VectorMath);

function zeroLit(dim: PinType): string {
  return dim === "vec2" ? "vec2(0.0)" : dim === "vec3" ? "vec3(0.0)" : "0.0";
}

function oneLit(dim: PinType): string {
  return dim === "vec2" ? "vec2(1.0)" : dim === "vec3" ? "vec3(1.0)" : "1.0";
}
