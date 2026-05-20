// Crystal — graph-decomposed. Per-cell vec2 offset from two independent
// hashes (cell.x as x-coord, cell.y as y-coord to decorrelate); three
// channel-isolated samples with CA offset; an edge-rim term added from the
// per-cell fract distance.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Crystal",
  description: "Crystalline faceted refraction",
  color: "#a78bfa",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Crystal extends ProceduralEffect {
  static readonly typeId = "crystal";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "facets", type: "float", label: "Facets", default: 8 },
      { id: "chromaticAberration", type: "float", label: "Chromatic Aberration", default: 0.3 },
      { id: "fresnel", type: "float", label: "Fresnel", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // q = uv · facets; cell = floor(q); fpos = fract(q)
    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const qx = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "x").to(qx, "a");
    b.connect(gi.facets).to(qx, "b");
    const qy = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(qy, "a");
    b.connect(gi.facets).to(qy, "b");
    const cellX = b.add(new N.Math({ op: "floor" }));
    b.connect(qx).to(cellX, "x");
    const cellY = b.add(new N.Math({ op: "floor" }));
    b.connect(qy).to(cellY, "x");
    const fposX = b.add(new N.Math({ op: "fract" }));
    b.connect(qx).to(fposX, "x");
    const fposY = b.add(new N.Math({ op: "fract" }));
    b.connect(qy).to(fposY, "x");

    // Two hashes per cell to make a vec2: hash(vec2(cell.x, cell.y)) and
    // hash(vec2(cell.y, cell.x)) decorrelate.
    const c1 = b.add(new N.CombineXy());
    b.connect(cellX).to(c1, "x");
    b.connect(cellY).to(c1, "y");
    const h1 = b.add(new N.Hash());
    b.connect(c1).to(h1, "p");
    const c2 = b.add(new N.CombineXy());
    b.connect(cellY).to(c2, "x");
    b.connect(cellX).to(c2, "y");
    const h2 = b.add(new N.Hash());
    b.connect(c2).to(h2, "p");

    // offset = (h − 0.5) · 2 · intensity · 0.05
    const off = (h: { nodeId: string; pin: string }) => {
      const h5 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
      b.connect(h).to(h5, "a");
      const h2v = b.add(new N.Math({ op: "mul" }), { b: 2 });
      b.connect(h5).to(h2v, "a");
      const hi = b.add(new N.Math({ op: "mul" }));
      b.connect(h2v).to(hi, "a");
      b.connect(gi.intensity).to(hi, "b");
      const ho = b.add(new N.Math({ op: "mul" }), { b: 0.05 });
      b.connect(hi).to(ho, "a");
      return ho;
    };
    const offX = off(h1);
    const offY = off(h2);
    const offset = b.add(new N.CombineXy());
    b.connect(offX).to(offset, "x");
    b.connect(offY).to(offset, "y");

    // caDir = normalize(offset + tiny) · ca · 0.015
    const eps = b.add(new N.CombineXy());
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "x");
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "y");
    const offEps = b.add(new N.VectorMath({ op: "add" }));
    b.connect(offset).to(offEps, "a");
    b.connect(eps).to(offEps, "b");
    const caDir = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(offEps).to(caDir, "a");
    const caStr = b.add(new N.Math({ op: "mul" }), { b: 0.015 });
    b.connect(gi.chromaticAberration).to(caStr, "a");
    const caOff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(caDir).to(caOff, "a");
    b.connect(caStr).to(caOff, "b");

    // Sample R/G/B at uv + offset ± caOff.
    const uvCenter = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(uvCenter, "a");
    b.connect(offset).to(uvCenter, "b");

    const uvR = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uvCenter).to(uvR, "a");
    b.connect(caOff).to(uvR, "b");
    const sampleR = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uvR).to(sampleR, "uv");

    const sampleG = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uvCenter).to(sampleG, "uv");

    const uvB = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uvCenter).to(uvB, "a");
    b.connect(caOff).to(uvB, "b");
    const sampleB = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uvB).to(sampleB, "uv");

    const sepR = b.add(new N.SeparateColor());
    b.connect(sampleR, "color").to(sepR, "v");
    const sepG = b.add(new N.SeparateColor());
    b.connect(sampleG, "color").to(sepG, "v");
    const sepB = b.add(new N.SeparateColor());
    b.connect(sampleB, "color").to(sepB, "v");
    const col = b.add(new N.CombineColor());
    b.connect(sepR, "r").to(col, "r");
    b.connect(sepG, "g").to(col, "g");
    b.connect(sepB, "b").to(col, "b");

    // edgeDist = min(fpos, 1 − fpos) — take min of x and y components.
    const oneMinusX = b.add(new N.Math({ op: "oneminus" }));
    b.connect(fposX).to(oneMinusX, "x");
    const oneMinusY = b.add(new N.Math({ op: "oneminus" }));
    b.connect(fposY).to(oneMinusY, "x");
    const minX = b.add(new N.Math({ op: "min" }));
    b.connect(fposX).to(minX, "a");
    b.connect(oneMinusX).to(minX, "b");
    const minY = b.add(new N.Math({ op: "min" }));
    b.connect(fposY).to(minY, "a");
    b.connect(oneMinusY).to(minY, "b");
    const edgeMin = b.add(new N.Math({ op: "min" }));
    b.connect(minX).to(edgeMin, "a");
    b.connect(minY).to(edgeMin, "b");
    const rim = b.add(new N.Smoothstep(), { edge0: 0, edge1: 0.15 });
    b.connect(edgeMin).to(rim, "x");
    const rimInv = b.add(new N.Math({ op: "oneminus" }));
    b.connect(rim).to(rimInv, "x");
    const rimF = b.add(new N.Math({ op: "mul" }));
    b.connect(rimInv).to(rimF, "a");
    b.connect(gi.fresnel).to(rimF, "b");
    const out = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(col).to(out, "a");
    b.connect(rimF).to(out, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(Crystal);
export default Crystal;
