// VectorMath — vec2 operations. The pin shape depends on `op`:
//
//   length     | (vec2) → float
//   normalize  | (vec2) → vec2
//   dot        | (vec2, vec2) → float
//   distance   | (vec2, vec2) → float
//   add        | (vec2, vec2) → vec2
//   sub        | (vec2, vec2) → vec2
//   scale      | (vec2, float) → vec2
//   rotate2D   | (vec2, float) → vec2  (angle in radians)
//
// `add`/`sub` aren't in the original Phase 2 plan but they fall out of the
// same dispatch table and are needed by hand-authored graphs (e.g. shifting
// `p` by a centre uniform), so they ship here.

import { z } from "zod";
import { registerPrimitive } from "../registry";
import type { PinSpec } from "../types";

const OPS = [
  "length",
  "normalize",
  "dot",
  "distance",
  "add",
  "sub",
  "scale",
  "rotate2D",
  "floor",
  "fract",
  "abs",
] as const;

const config = z.object({
  op: z.enum(OPS).default("length"),
});

type Config = z.infer<typeof config>;

const A_VEC2: PinSpec = { id: "a", type: "vec2", label: "A", default: [0, 0] };
const B_VEC2: PinSpec = { id: "b", type: "vec2", label: "B", default: [0, 0] };
const B_FLOAT: PinSpec = { id: "b", type: "float", label: "B", default: 1 };

const OUT_VEC2: PinSpec = { id: "out", type: "vec2", label: "Out" };
const OUT_FLOAT: PinSpec = { id: "out", type: "float", label: "Out" };

function pinsFor(op: Config["op"]): { in: readonly PinSpec[]; out: readonly PinSpec[] } {
  switch (op) {
    case "length":
      return { in: [A_VEC2], out: [OUT_FLOAT] };
    case "normalize":
    case "floor":
    case "fract":
    case "abs":
      return { in: [A_VEC2], out: [OUT_VEC2] };
    case "dot":
    case "distance":
      return { in: [A_VEC2, B_VEC2], out: [OUT_FLOAT] };
    case "add":
    case "sub":
      return { in: [A_VEC2, B_VEC2], out: [OUT_VEC2] };
    case "scale":
    case "rotate2D":
      return { in: [A_VEC2, B_FLOAT], out: [OUT_VEC2] };
  }
}

export default registerPrimitive({
  typeId: "vector-math",
  name: "Vector Math",
  category: "math",
  color: "#a78bfa",
  description: "vec2 operations — length, normalize, dot, distance, add, sub, scale, rotate2D.",
  config,

  inputs(cfg) {
    return pinsFor((cfg as Config).op).in;
  },

  outputs(cfg) {
    return pinsFor((cfg as Config).op).out;
  },

  emit(ctx) {
    const c = ctx.config as Config;
    const a = ctx.inputs.a;
    const b = ctx.inputs.b;
    const o = ctx.outputs.out;
    switch (c.op) {
      case "length":
        return { statements: `float ${o} = length(${a});` };
      case "normalize":
        return { statements: `vec2 ${o} = (length(${a}) > 1e-6) ? normalize(${a}) : vec2(0.0);` };
      case "dot":
        return { statements: `float ${o} = dot(${a}, ${b});` };
      case "distance":
        return { statements: `float ${o} = distance(${a}, ${b});` };
      case "add":
        return { statements: `vec2 ${o} = ${a} + ${b};` };
      case "sub":
        return { statements: `vec2 ${o} = ${a} - ${b};` };
      case "scale":
        return { statements: `vec2 ${o} = ${a} * ${b};` };
      case "rotate2D":
        // The cos/sin pair is recomputed here instead of being hoisted because
        // the topo-sort emitter scopes locals per-node; sharing across two
        // ops would require introducing a helper or a shared local convention
        // we don't currently have.
        return {
          statements: `vec2 ${o} = mat2(cos(${b}), -sin(${b}), sin(${b}), cos(${b})) * ${a};`,
        };
      case "floor":
        return { statements: `vec2 ${o} = floor(${a});` };
      case "fract":
        return { statements: `vec2 ${o} = fract(${a});` };
      case "abs":
        return { statements: `vec2 ${o} = abs(${a});` };
    }
  },
});
