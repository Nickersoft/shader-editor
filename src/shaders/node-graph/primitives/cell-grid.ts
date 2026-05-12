// CellGrid — partitions `p` into an integer-cell grid, returning the
// per-cell-local UV (each cell is `[0,1) × [0,1)`) and a stable scalar id
// derived from the cell coordinate.
//
// `scale` multiplies the input before the cell partition — at scale=1, each
// pixel of `p`'s domain spans one cell, which is rarely what you want. Plan
// for grids in the 4–40 range.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { registerPrimitive, type UniformSpec } from "../registry";
import type { PinSpec } from "../types";

const config = z.object({
  scale: zFloat(0.1, 200).default(8),
});

type Config = z.infer<typeof config>;

const INPUTS: readonly PinSpec[] = [{ id: "p", type: "vec2", label: "P", default: [0, 0] }];
const OUTPUTS: readonly PinSpec[] = [
  { id: "uv", type: "vec2", label: "Cell UV" },
  { id: "id", type: "float", label: "Cell ID" },
];

export default registerPrimitive({
  typeId: "cell-grid",
  name: "Cell Grid",
  category: "sources",
  color: "#f97316",
  description: "Integer grid → per-cell-local UV + stable cell id.",
  config,

  inputs() {
    return INPUTS;
  },

  outputs() {
    return OUTPUTS;
  },

  uniforms(node) {
    const c = node.config as Config;
    return [{ nameSuffix: "scale", type: "float", value: c.scale } satisfies UniformSpec];
  },

  emit(ctx) {
    ctx.addDependency("hash21");
    const p = ctx.inputs.p;
    const scale = ctx.uniforms.scale;
    const uv = ctx.outputs.uv;
    const id = ctx.outputs.id;
    return {
      statements: `vec2 ${uv}_scaled = ${p} * ${scale};
vec2 ${uv} = fract(${uv}_scaled);
float ${id} = hash21(floor(${uv}_scaled));`,
    };
  },
});
