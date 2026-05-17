import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";

const meta: NodeMeta = {
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
    const scaled = b.add("vector-math", { op: "scale" });
    b.connect(p, scaled.nodeId, "a");
    b.connect(gi.scale, scaled.nodeId, "b");
    const cell = b.add("vector-math", { op: "floor" });
    b.connect(scaled, cell.nodeId, "a");
    const frac = b.add("vector-math", { op: "fract" });
    b.connect(scaled, frac.nodeId, "a");
    const halfV = b.add("combine-xy", {}, { x: 0.5, y: 0.5 });
    const local = b.add("vector-math", { op: "sub" });
    b.connect(frac, local.nodeId, "a");
    b.connect(halfV, local.nodeId, "b");
    const absLocal = b.add("vector-math", { op: "abs" });
    b.connect(local, absLocal.nodeId, "a");
    const sepAbs = b.add("separate-xy", {});
    b.connect(absLocal, sepAbs.nodeId, "v");

    // over = step((cell.x + cell.y) mod 2, 0.5) — 1 when sum is even
    const sepCell = b.add("separate-xy", {});
    b.connect(cell, sepCell.nodeId, "v");
    const sumXY = b.add("math", { op: "add" });
    b.connect({ nodeId: sepCell.nodeId, pin: "x" }, sumXY.nodeId, "a");
    b.connect({ nodeId: sepCell.nodeId, pin: "y" }, sumXY.nodeId, "b");
    const modSum = b.add("math", { op: "mod" }, { b: 2 });
    b.connect(sumXY, modSum.nodeId, "a");
    const over = b.add("math", { op: "step" }, { b: 0.5 });
    b.connect(modSum, over.nodeId, "a");

    // th = (0.5 - clamp(gap, 0, 0.5)) * 0.5 + 0.05
    const gapClamp = b.add("map-range", {
      fromMin: 0,
      fromMax: 0.5,
      toMin: 0,
      toMax: 0.5,
      interp: "linear",
      clamp: true,
    });
    b.connect(gi.gap, gapClamp.nodeId, "x");
    const halfMinus = b.add("math", { op: "sub" }, { a: 0.5 });
    b.connect(gapClamp, halfMinus.nodeId, "b");
    const halfMinusHalf = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(halfMinus, halfMinusHalf.nodeId, "a");
    const th = b.add("math", { op: "add" }, { b: 0.05 });
    b.connect(halfMinusHalf, th.nodeId, "a");

    // h = 1 - step(th, |local.y|)    (horizontal strand from y)
    // v = 1 - step(th, |local.x|)
    const stepH = b.add("math", { op: "step" });
    b.connect(th, stepH.nodeId, "a");
    b.connect({ nodeId: sepAbs.nodeId, pin: "y" }, stepH.nodeId, "b");
    const h = b.add("math", { op: "oneminus" });
    b.connect(stepH, h.nodeId, "x");
    const stepV = b.add("math", { op: "step" });
    b.connect(th, stepV.nodeId, "a");
    b.connect({ nodeId: sepAbs.nodeId, pin: "x" }, stepV.nodeId, "b");
    const v = b.add("math", { op: "oneminus" });
    b.connect(stepV, v.nodeId, "x");

    // hHalf = h * 0.5; vHalf = v * 0.5
    const hHalf = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(h, hHalf.nodeId, "a");
    const vHalf = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(v, vHalf.nodeId, "a");

    // am = over ? h : hHalf      → hHalf + over * (h - hHalf)
    const hDiff = b.add("math", { op: "sub" });
    b.connect(h, hDiff.nodeId, "a");
    b.connect(hHalf, hDiff.nodeId, "b");
    const hContrib = b.add("math", { op: "mul" });
    b.connect(hDiff, hContrib.nodeId, "a");
    b.connect(over, hContrib.nodeId, "b");
    const am = b.add("math", { op: "add" });
    b.connect(hHalf, am.nodeId, "a");
    b.connect(hContrib, am.nodeId, "b");

    // bm = over ? vHalf : v      → v + over * (vHalf - v)
    const vDiff = b.add("math", { op: "sub" });
    b.connect(vHalf, vDiff.nodeId, "a");
    b.connect(v, vDiff.nodeId, "b");
    const vContrib = b.add("math", { op: "mul" });
    b.connect(vDiff, vContrib.nodeId, "a");
    b.connect(over, vContrib.nodeId, "b");
    const bm = b.add("math", { op: "add" });
    b.connect(v, bm.nodeId, "a");
    b.connect(vContrib, bm.nodeId, "b");

    // out = max(am, bm)
    const out = b.add("math", { op: "max" });
    b.connect(am, out.nodeId, "a");
    b.connect(bm, out.nodeId, "b");

    const ramp = b.colorRamp(out, [
      [0.3, 0.3, 0.3],
      [0.77, 0.77, 0.77],
    ]);
    return b.output(ramp);
  }
}

register(Weave);
export default Weave;
