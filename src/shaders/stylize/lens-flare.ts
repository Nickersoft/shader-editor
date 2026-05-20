// LensFlare — graph-decomposed. The legacy effect loops up to 8 "ghost"
// orbs whose contribution is gated by an integer `ghosts` count. The graph
// form unrolls the loop to 8 fixed iterations and gates each one by
// `step(float(i), ghosts)`, so the contribution is exactly zero past the
// user-set count without an actual GLSL branch. Core / halo / streak are
// modelled directly from the legacy expressions.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type NodeHandle } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Lens Flare",
  description: "Anamorphic lens flare with ghosts, halo, and streak",
  color: "#fde047",
  category: "stylize",
  defaultBlendMode: "add",
};

export class LensFlare extends ProceduralEffect {
  static readonly typeId = "lens-flare";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const centre = b.add(new N.CombineXy());
    b.connect(gi.lightX).to(centre, "x");
    b.connect(gi.lightY).to(centre, "y");

    // p = uv − centre
    const p = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(p, "a");
    b.connect(centre).to(p, "b");
    const r = b.add(new N.VectorMath({ op: "length" }));
    b.connect(p).to(r, "a");

    // core = exp(−r² · 60)
    const r2 = b.add(new N.Math({ op: "mul" }));
    b.connect(r).to(r2, "a");
    b.connect(r).to(r2, "b");
    const r2_60 = b.add(new N.Math({ op: "mul" }), { b: 60 });
    b.connect(r2).to(r2_60, "a");
    const negR2_60 = b.add(new N.Math({ op: "neg" }));
    b.connect(r2_60).to(negR2_60, "x");
    const core = b.add(new N.Math({ op: "exp" }));
    b.connect(negR2_60).to(core, "x");

    // halo = exp(−((|r − haloSize|) · 8)²)
    const rDiff = b.add(new N.Math({ op: "sub" }));
    b.connect(r).to(rDiff, "a");
    b.connect(gi.haloSize).to(rDiff, "b");
    const rDiffAbs = b.add(new N.Math({ op: "abs" }));
    b.connect(rDiff).to(rDiffAbs, "x");
    const rd8 = b.add(new N.Math({ op: "mul" }), { b: 8 });
    b.connect(rDiffAbs).to(rd8, "a");
    const rd8_2 = b.add(new N.Math({ op: "mul" }));
    b.connect(rd8).to(rd8_2, "a");
    b.connect(rd8).to(rd8_2, "b");
    const negRd8_2 = b.add(new N.Math({ op: "neg" }));
    b.connect(rd8_2).to(negRd8_2, "x");
    const halo = b.add(new N.Math({ op: "exp" }));
    b.connect(negRd8_2).to(halo, "x");

    // streak = exp(−|p.y| · 80) · exp(−|p.x| / max(streakLength, 1e-4))
    const sepP = b.add(new N.SeparateXy());
    b.connect(p).to(sepP, "v");
    const py = b.add(new N.Math({ op: "abs" }));
    b.connect(sepP, "y").to(py, "x");
    const py80 = b.add(new N.Math({ op: "mul" }), { b: 80 });
    b.connect(py).to(py80, "a");
    const negPy80 = b.add(new N.Math({ op: "neg" }));
    b.connect(py80).to(negPy80, "x");
    const streakY = b.add(new N.Math({ op: "exp" }));
    b.connect(negPy80).to(streakY, "x");

    const px = b.add(new N.Math({ op: "abs" }));
    b.connect(sepP, "x").to(px, "x");
    const slSafe = b.add(new N.Math({ op: "max" }), { b: 1e-4 });
    b.connect(gi.streakLength).to(slSafe, "a");
    const pxOver = b.add(new N.Math({ op: "div" }));
    b.connect(px).to(pxOver, "a");
    b.connect(slSafe).to(pxOver, "b");
    const negPxOver = b.add(new N.Math({ op: "neg" }));
    b.connect(pxOver).to(negPxOver, "x");
    const streakX = b.add(new N.Math({ op: "exp" }));
    b.connect(negPxOver).to(streakX, "x");

    const streak = b.add(new N.Math({ op: "mul" }));
    b.connect(streakY).to(streak, "a");
    b.connect(streakX).to(streak, "b");

    // Unrolled ghosts loop. For i ∈ 1..8:
    //   g_i = (centre − uv) · (i / max(N, 1)) · ghostSpacing
    //   gp_i = ((uv + g_i) − centre)
    //   gd_i = length(gp_i)
    //   contribution = step(i, N) · exp(−gd_i² · 80) · (1 / i)
    const cmu = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(centre).to(cmu, "a");
    b.connect(uv).to(cmu, "b");
    const nMax = b.add(new N.Math({ op: "max" }), { b: 1 });
    b.connect(gi.ghosts).to(nMax, "a");

    const ghostContrib = (i: number): NodeHandle => {
      const iVal = b.add(new N.Const({ value: i }));
      const iOverN = b.add(new N.Math({ op: "div" }));
      b.connect(iVal).to(iOverN, "a");
      b.connect(nMax).to(iOverN, "b");
      const k = b.add(new N.Math({ op: "mul" }));
      b.connect(iOverN).to(k, "a");
      b.connect(gi.ghostSpacing).to(k, "b");
      const g = b.add(new N.VectorMath({ op: "scale" }));
      b.connect(cmu).to(g, "a");
      b.connect(k).to(g, "b");
      // gp = (uv + g) − centre  ⇒ gp = (uv − centre) + g = p + g
      const gp = b.add(new N.VectorMath({ op: "add" }));
      b.connect(p).to(gp, "a");
      b.connect(g).to(gp, "b");
      const gd = b.add(new N.VectorMath({ op: "length" }));
      b.connect(gp).to(gd, "a");
      const gd2 = b.add(new N.Math({ op: "mul" }));
      b.connect(gd).to(gd2, "a");
      b.connect(gd).to(gd2, "b");
      const gd2_80 = b.add(new N.Math({ op: "mul" }), { b: 80 });
      b.connect(gd2).to(gd2_80, "a");
      const negGd2 = b.add(new N.Math({ op: "neg" }));
      b.connect(gd2_80).to(negGd2, "x");
      const e = b.add(new N.Math({ op: "exp" }));
      b.connect(negGd2).to(e, "x");
      const eOverI = b.add(new N.Math({ op: "mul" }), { b: 1 / i });
      b.connect(e).to(eOverI, "a");
      // gate = step(i, ghosts)  (1 when ghosts ≥ i)
      const gate = b.add(new N.Math({ op: "step" }), { a: i });
      b.connect(gi.ghosts).to(gate, "b");
      const gated = b.add(new N.Math({ op: "mul" }));
      b.connect(eOverI).to(gated, "a");
      b.connect(gate).to(gated, "b");
      return gated;
    };

    const ghostsAcc = [1, 2, 3, 4, 5, 6, 7, 8]
      .map(ghostContrib)
      .reduce<NodeHandle | null>((acc, contrib) => {
        if (!acc) return contrib;
        const sum = b.add(new N.Math({ op: "add" }));
        b.connect(acc).to(sum, "a");
        b.connect(contrib).to(sum, "b");
        return sum;
      }, null)!;

    // v = (core + halo · 0.6 + streak · 0.7 + ghosts · 0.8) · intensity
    const halo6 = b.add(new N.Math({ op: "mul" }), { b: 0.6 });
    b.connect(halo).to(halo6, "a");
    const streak7 = b.add(new N.Math({ op: "mul" }), { b: 0.7 });
    b.connect(streak).to(streak7, "a");
    const ghosts8 = b.add(new N.Math({ op: "mul" }), { b: 0.8 });
    b.connect(ghostsAcc).to(ghosts8, "a");
    const s1 = b.add(new N.Math({ op: "add" }));
    b.connect(core).to(s1, "a");
    b.connect(halo6).to(s1, "b");
    const s2 = b.add(new N.Math({ op: "add" }));
    b.connect(s1).to(s2, "a");
    b.connect(streak7).to(s2, "b");
    const s3 = b.add(new N.Math({ op: "add" }));
    b.connect(s2).to(s3, "a");
    b.connect(ghosts8).to(s3, "b");
    const v = b.add(new N.Math({ op: "mul" }));
    b.connect(s3).to(v, "a");
    b.connect(gi.intensity).to(v, "b");

    // rgb = color · v
    const rgb = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(gi.color).to(rgb, "a");
    b.connect(v).to(rgb, "b");

    // alpha = clamp(v, 0, 1)
    const aMin = b.add(new N.Math({ op: "min" }), { b: 1 });
    b.connect(v).to(aMin, "a");
    const alpha = b.add(new N.Math({ op: "max" }), { b: 0 });
    b.connect(aMin).to(alpha, "a");

    return b.output(rgb, alpha);
  }
}

register(LensFlare);
export default LensFlare;
