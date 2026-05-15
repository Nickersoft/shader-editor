// LensFlare — graph-decomposed. The legacy effect loops up to 8 "ghost"
// orbs whose contribution is gated by an integer `ghosts` count. The graph
// form unrolls the loop to 8 fixed iterations and gates each one by
// `step(float(i), ghosts)`, so the contribution is exactly zero past the
// user-set count without an actual GLSL branch. Core / halo / streak are
// modelled directly from the legacy expressions.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder, type PrevRef } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Lens Flare",
  description: "Anamorphic lens flare with ghosts, halo, and streak",
  color: "#fde047",
  category: "stylize",
  defaultBlendMode: "add",
};

export class LensFlare extends GraphEffectBase {
  static readonly typeId = "lens-flare";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "lightX", type: "float", label: "Light X", default: 0.5 },
      { id: "lightY", type: "float", label: "Light Y", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
      { id: "ghosts", type: "float", label: "Ghosts", default: 4 },
      { id: "ghostSpacing", type: "float", label: "Ghost Spacing", default: 0.3 },
      { id: "haloSize", type: "float", label: "Halo Size", default: 0.5 },
      { id: "streakLength", type: "float", label: "Streak Length", default: 0.3 },
      { id: "color", type: "vec3", label: "Color", default: [1, 0.9, 0.7] },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const centre = b.add("combine-xy", {});
    b.connect(gi.lightX, centre.nodeId, "x");
    b.connect(gi.lightY, centre.nodeId, "y");

    // p = uv − centre
    const p = b.add("vector-math", { op: "sub" });
    b.connect(uv, p.nodeId, "a");
    b.connect(centre, p.nodeId, "b");
    const r = b.add("vector-math", { op: "length" });
    b.connect(p, r.nodeId, "a");

    // core = exp(−r² · 60)
    const r2 = b.add("math", { op: "mul" });
    b.connect(r, r2.nodeId, "a");
    b.connect(r, r2.nodeId, "b");
    const r2_60 = b.add("math", { op: "mul" }, { b: 60 });
    b.connect(r2, r2_60.nodeId, "a");
    const negR2_60 = b.add("math", { op: "neg" });
    b.connect(r2_60, negR2_60.nodeId, "x");
    const core = b.add("math", { op: "exp" });
    b.connect(negR2_60, core.nodeId, "x");

    // halo = exp(−((|r − haloSize|) · 8)²)
    const rDiff = b.add("math", { op: "sub" });
    b.connect(r, rDiff.nodeId, "a");
    b.connect(gi.haloSize, rDiff.nodeId, "b");
    const rDiffAbs = b.add("math", { op: "abs" });
    b.connect(rDiff, rDiffAbs.nodeId, "x");
    const rd8 = b.add("math", { op: "mul" }, { b: 8 });
    b.connect(rDiffAbs, rd8.nodeId, "a");
    const rd8_2 = b.add("math", { op: "mul" });
    b.connect(rd8, rd8_2.nodeId, "a");
    b.connect(rd8, rd8_2.nodeId, "b");
    const negRd8_2 = b.add("math", { op: "neg" });
    b.connect(rd8_2, negRd8_2.nodeId, "x");
    const halo = b.add("math", { op: "exp" });
    b.connect(negRd8_2, halo.nodeId, "x");

    // streak = exp(−|p.y| · 80) · exp(−|p.x| / max(streakLength, 1e-4))
    const sepP = b.add("separate-xy", {});
    b.connect(p, sepP.nodeId, "v");
    const py = b.add("math", { op: "abs" });
    b.connect({ nodeId: sepP.nodeId, pin: "y" }, py.nodeId, "x");
    const py80 = b.add("math", { op: "mul" }, { b: 80 });
    b.connect(py, py80.nodeId, "a");
    const negPy80 = b.add("math", { op: "neg" });
    b.connect(py80, negPy80.nodeId, "x");
    const streakY = b.add("math", { op: "exp" });
    b.connect(negPy80, streakY.nodeId, "x");

    const px = b.add("math", { op: "abs" });
    b.connect({ nodeId: sepP.nodeId, pin: "x" }, px.nodeId, "x");
    const slSafe = b.add("math", { op: "max" }, { b: 1e-4 });
    b.connect(gi.streakLength, slSafe.nodeId, "a");
    const pxOver = b.add("math", { op: "div" });
    b.connect(px, pxOver.nodeId, "a");
    b.connect(slSafe, pxOver.nodeId, "b");
    const negPxOver = b.add("math", { op: "neg" });
    b.connect(pxOver, negPxOver.nodeId, "x");
    const streakX = b.add("math", { op: "exp" });
    b.connect(negPxOver, streakX.nodeId, "x");

    const streak = b.add("math", { op: "mul" });
    b.connect(streakY, streak.nodeId, "a");
    b.connect(streakX, streak.nodeId, "b");

    // Unrolled ghosts loop. For i ∈ 1..8:
    //   g_i = (centre − uv) · (i / max(N, 1)) · ghostSpacing
    //   gp_i = ((uv + g_i) − centre)
    //   gd_i = length(gp_i)
    //   contribution = step(i, N) · exp(−gd_i² · 80) · (1 / i)
    const cmu = b.add("vector-math", { op: "sub" });
    b.connect(centre, cmu.nodeId, "a");
    b.connect(uv, cmu.nodeId, "b");
    const nMax = b.add("math", { op: "max" }, { b: 1 });
    b.connect(gi.ghosts, nMax.nodeId, "a");

    const ghostContrib = (i: number): PrevRef => {
      const iVal = b.add("value", { value: i });
      const iOverN = b.add("math", { op: "div" });
      b.connect(iVal, iOverN.nodeId, "a");
      b.connect(nMax, iOverN.nodeId, "b");
      const k = b.add("math", { op: "mul" });
      b.connect(iOverN, k.nodeId, "a");
      b.connect(gi.ghostSpacing, k.nodeId, "b");
      const g = b.add("vector-math", { op: "scale" });
      b.connect(cmu, g.nodeId, "a");
      b.connect(k, g.nodeId, "b");
      // gp = (uv + g) − centre  ⇒ gp = (uv − centre) + g = p + g
      const gp = b.add("vector-math", { op: "add" });
      b.connect(p, gp.nodeId, "a");
      b.connect(g, gp.nodeId, "b");
      const gd = b.add("vector-math", { op: "length" });
      b.connect(gp, gd.nodeId, "a");
      const gd2 = b.add("math", { op: "mul" });
      b.connect(gd, gd2.nodeId, "a");
      b.connect(gd, gd2.nodeId, "b");
      const gd2_80 = b.add("math", { op: "mul" }, { b: 80 });
      b.connect(gd2, gd2_80.nodeId, "a");
      const negGd2 = b.add("math", { op: "neg" });
      b.connect(gd2_80, negGd2.nodeId, "x");
      const e = b.add("math", { op: "exp" });
      b.connect(negGd2, e.nodeId, "x");
      const eOverI = b.add("math", { op: "mul" }, { b: 1 / i });
      b.connect(e, eOverI.nodeId, "a");
      // gate = step(i, ghosts)  (1 when ghosts ≥ i)
      const gate = b.add("math", { op: "step" }, { a: i });
      b.connect(gi.ghosts, gate.nodeId, "b");
      const gated = b.add("math", { op: "mul" });
      b.connect(eOverI, gated.nodeId, "a");
      b.connect(gate, gated.nodeId, "b");
      return gated;
    };

    const ghostsAcc = [1, 2, 3, 4, 5, 6, 7, 8]
      .map(ghostContrib)
      .reduce<PrevRef | null>((acc, contrib) => {
        if (!acc) return contrib;
        const sum = b.add("math", { op: "add" });
        b.connect(acc, sum.nodeId, "a");
        b.connect(contrib, sum.nodeId, "b");
        return sum;
      }, null)!;

    // v = (core + halo · 0.6 + streak · 0.7 + ghosts · 0.8) · intensity
    const halo6 = b.add("math", { op: "mul" }, { b: 0.6 });
    b.connect(halo, halo6.nodeId, "a");
    const streak7 = b.add("math", { op: "mul" }, { b: 0.7 });
    b.connect(streak, streak7.nodeId, "a");
    const ghosts8 = b.add("math", { op: "mul" }, { b: 0.8 });
    b.connect(ghostsAcc, ghosts8.nodeId, "a");
    const s1 = b.add("math", { op: "add" });
    b.connect(core, s1.nodeId, "a");
    b.connect(halo6, s1.nodeId, "b");
    const s2 = b.add("math", { op: "add" });
    b.connect(s1, s2.nodeId, "a");
    b.connect(streak7, s2.nodeId, "b");
    const s3 = b.add("math", { op: "add" });
    b.connect(s2, s3.nodeId, "a");
    b.connect(ghosts8, s3.nodeId, "b");
    const v = b.add("math", { op: "mul" });
    b.connect(s3, v.nodeId, "a");
    b.connect(gi.intensity, v.nodeId, "b");

    // rgb = color · v
    const rgb = b.add("color-math", { op: "scale" });
    b.connect(gi.color, rgb.nodeId, "a");
    b.connect(v, rgb.nodeId, "b");

    // alpha = clamp(v, 0, 1)
    const aMin = b.add("math", { op: "min" }, { b: 1 });
    b.connect(v, aMin.nodeId, "a");
    const alpha = b.add("math", { op: "max" }, { b: 0 });
    b.connect(aMin, alpha.nodeId, "a");

    return b.output(rgb, alpha);
  }
}

register(LensFlare);
export default LensFlare;
