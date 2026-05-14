// Pixelate — snap a UV to a lattice. Outputs the centre UV of the cell the
// input falls inside, producing the blocky low-resolution look. Pairs with
// `sample-previous-pass` (sample at the snapped UV) or with any UV-driven
// generator that should appear quantised.

import { z } from "zod";
import { uv, vec2 } from "../pins";
import {
  BasePrimitive,
  register,
  type EmitContext,
  type EmitResult,
  type PrimitiveMeta,
} from "../registry";

const config = z.object({});

const pinIn = z.object({
  uv: uv("UV", [0.5, 0.5]),
  // Cell counts along x and y. Default to 64×64 — a sensible "looks pixelated
  // but legible" baseline for first-drag visualisation.
  cells: vec2("Cells", [64, 64]),
});

const pinOut = z.object({
  out: uv("UV"),
});

type In = z.infer<typeof pinIn>;
type Out = z.infer<typeof pinOut>;

class Pixelate extends BasePrimitive<Record<string, never>, In, Out> {
  static readonly typeId = "pixelate";
  static readonly meta: PrimitiveMeta = {
    name: "Pixelate",
    category: "vector",
    color: "#a78bfa",
    description: "Snap a UV to a lattice of `cells` × `cells`.",
  };
  static readonly config = config;
  static readonly pins = { in: pinIn, out: pinOut };

  emit(ctx: EmitContext<In, Out>): EmitResult {
    const u = ctx.inputs.uv;
    const cells = ctx.inputs.cells;
    const o = ctx.outputs.out;
    // (floor(uv * cells) + 0.5) / cells → centre of the containing cell.
    // max() guards against division by zero when cells is unset.
    return {
      statements: `vec2 ${o}_c = max(${cells}, vec2(1.0));
vec2 ${o} = (floor(${u} * ${o}_c) + 0.5) / ${o}_c;`,
    };
  }
}

export default register(Pixelate);
