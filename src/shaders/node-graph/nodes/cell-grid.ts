// CellGrid — partitions `p` into an integer-cell grid, returning the
// per-cell-local UV (each cell is `[0,1) × [0,1)`) and a stable scalar id
// derived from the cell coordinate.
//
// `scale` multiplies the input before the cell partition — at scale=1, each
// pixel of `p`'s domain spans one cell, which is rarely what you want. Plan
// for grids in the 4–40 range.

import { z } from "zod";
import { zFloat } from "@/shaders/core/schemas";
import { float, vec2 } from "../pins";
import {
  BaseNode,
  register,
  type EmitContext,
  type EmitResult,
  type NodeMeta,
} from "../registry";

const config = z.object({
  scale: zFloat(0.1, 200).default(8),
});

type Config = z.infer<typeof config>;

const pinIn = z.object({
  p: vec2("Position", [0, 0]),
});

const pinOut = z.object({
  uv: vec2("Cell UV"),
  id: float("Cell ID"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

export class CellGrid extends BaseNode<Config, In, Out> {
  static readonly typeId = "cell-grid";
  static readonly meta: NodeMeta = {
    name: "Cell Grid",
    category: "texture",
    color: "#f97316",
    description: "Integer grid → per-cell-local UV + stable cell id.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };
  static readonly uniformKeys = { scale: "float" } as const;

  emit(ctx: EmitContext<In, Out>): EmitResult {
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
  }
}

export default register(CellGrid);
