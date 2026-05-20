import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Weave",
  description: "Interlaced thread weave",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed Weave — over/under threads. `over` (a boolean from `cell.x +
// cell.y` parity) modulates the horizontal vs. vertical stroke amplitude.
// The ternary lives as `mix(strand × 0.5, strand, over)`.
export class Weave extends ProceduralShader {
  static readonly typeId = "weave";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "scale", type: "float", label: "Scale", default: 10 },
      { id: "gap", type: "float", label: "Gap", default: 0.25 },
    ]);
    const p = b.position();

    // scaled = p * scale; cell = floor(scaled); local = fract(scaled) - 0.5
    const scaled = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(p).to(scaled, "a");
    b.connect(gi.scale).to(scaled, "b");
    const cell = b.add(new N.VectorMath({ op: "floor" }));
    b.connect(scaled).to(cell, "a");
    const frac = b.add(new N.VectorMath({ op: "fract" }));
    b.connect(scaled).to(frac, "a");
    const halfV = b.add(new N.CombineXy(), { x: 0.5, y: 0.5 });
    const local = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(frac).to(local, "a");
    b.connect(halfV).to(local, "b");
    const absLocal = b.add(new N.VectorMath({ op: "abs" }));
    b.connect(local).to(absLocal, "a");
    const sepAbs = b.add(new N.SeparateXy());
    b.connect(absLocal).to(sepAbs, "v");

    // over = step((cell.x + cell.y) mod 2, 0.5) — 1 when sum is even
    const sepCell = b.add(new N.SeparateXy());
    b.connect(cell).to(sepCell, "v");
    const sumXY = b.add(new N.Math({ op: "add" }));
    b.connect(sepCell, "x").to(sumXY, "a");
    b.connect(sepCell, "y").to(sumXY, "b");
    const modSum = b.add(new N.Math({ op: "mod" }), { b: 2 });
    b.connect(sumXY).to(modSum, "a");
    const over = b.add(new N.Math({ op: "step" }), { b: 0.5 });
    b.connect(modSum).to(over, "a");

    // th = (0.5 - clamp(gap, 0, 0.5)) * 0.5 + 0.05
    const gapClamp = b.add(new N.MapRange({
      fromMin: 0,
      fromMax: 0.5,
      toMin: 0,
      toMax: 0.5,
      interp: "linear",
      clamp: true,
    }));
    b.connect(gi.gap).to(gapClamp, "x");
    const halfMinus = b.add(new N.Math({ op: "sub" }), { a: 0.5 });
    b.connect(gapClamp).to(halfMinus, "b");
    const halfMinusHalf = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(halfMinus).to(halfMinusHalf, "a");
    const th = b.add(new N.Math({ op: "add" }), { b: 0.05 });
    b.connect(halfMinusHalf).to(th, "a");

    // h = 1 - step(th, |local.y|)    (horizontal strand from y)
    // v = 1 - step(th, |local.x|)
    const stepH = b.add(new N.Math({ op: "step" }));
    b.connect(th).to(stepH, "a");
    b.connect(sepAbs, "y").to(stepH, "b");
    const h = b.add(new N.Math({ op: "oneminus" }));
    b.connect(stepH).to(h, "x");
    const stepV = b.add(new N.Math({ op: "step" }));
    b.connect(th).to(stepV, "a");
    b.connect(sepAbs, "x").to(stepV, "b");
    const v = b.add(new N.Math({ op: "oneminus" }));
    b.connect(stepV).to(v, "x");

    // hHalf = h * 0.5; vHalf = v * 0.5
    const hHalf = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(h).to(hHalf, "a");
    const vHalf = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(v).to(vHalf, "a");

    // am = over ? h : hHalf      → hHalf + over * (h - hHalf)
    const hDiff = b.add(new N.Math({ op: "sub" }));
    b.connect(h).to(hDiff, "a");
    b.connect(hHalf).to(hDiff, "b");
    const hContrib = b.add(new N.Math({ op: "mul" }));
    b.connect(hDiff).to(hContrib, "a");
    b.connect(over).to(hContrib, "b");
    const am = b.add(new N.Math({ op: "add" }));
    b.connect(hHalf).to(am, "a");
    b.connect(hContrib).to(am, "b");

    // bm = over ? vHalf : v      → v + over * (vHalf - v)
    const vDiff = b.add(new N.Math({ op: "sub" }));
    b.connect(vHalf).to(vDiff, "a");
    b.connect(v).to(vDiff, "b");
    const vContrib = b.add(new N.Math({ op: "mul" }));
    b.connect(vDiff).to(vContrib, "a");
    b.connect(over).to(vContrib, "b");
    const bm = b.add(new N.Math({ op: "add" }));
    b.connect(v).to(bm, "a");
    b.connect(vContrib).to(bm, "b");

    // out = max(am, bm)
    const out = b.add(new N.Math({ op: "max" }));
    b.connect(am).to(out, "a");
    b.connect(bm).to(out, "b");

    const ramp = b.colorRamp(out, [
      [0.3, 0.3, 0.3],
      [0.77, 0.77, 0.77],
    ]);
    return b.output(ramp);
  }
}

register(Weave);
export default Weave;
