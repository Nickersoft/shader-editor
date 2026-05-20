// Shatter — graph-decomposed. Per-cell vec2 jitter (two hashes); mouse
// impact boosts intensity inside an exponential falloff disc; final RGB
// pick from three channel-isolated samples with CA offset.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Shatter",
  description: "Voronoi-cell shatter with chromatic split",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class Shatter extends ProceduralEffect {
  static readonly typeId = "shatter";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "density", type: "float", label: "Density", default: 10 },
      { id: "chromaticAberration", type: "float", label: "Chromatic Aberration", default: 0.3 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const mouse = b.add(new N.Mouse(), undefined, "position");

    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const qx = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "x").to(qx, "a");
    b.connect(gi.density).to(qx, "b");
    const qy = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(qy, "a");
    b.connect(gi.density).to(qy, "b");
    const cellX1 = b.add(new N.Math({ op: "floor" }));
    b.connect(qx).to(cellX1, "x");
    const cellX = b.add(new N.Math({ op: "add" }));
    b.connect(cellX1).to(cellX, "a");
    b.connect(gi.seed).to(cellX, "b");
    const cellY1 = b.add(new N.Math({ op: "floor" }));
    b.connect(qy).to(cellY1, "x");
    const cellY = b.add(new N.Math({ op: "add" }));
    b.connect(cellY1).to(cellY, "a");
    b.connect(gi.seed).to(cellY, "b");

    // mouseImpact = exp(−distance(uv, mouse) · 6)
    const dist = b.add(new N.VectorMath({ op: "distance" }));
    b.connect(uv).to(dist, "a");
    b.connect(mouse).to(dist, "b");
    const dist6 = b.add(new N.Math({ op: "mul" }), { b: 6 });
    b.connect(dist).to(dist6, "a");
    const negDist = b.add(new N.Math({ op: "neg" }));
    b.connect(dist6).to(negDist, "x");
    const impact = b.add(new N.Math({ op: "exp" }));
    b.connect(negDist).to(impact, "x");
    const effIntensity1 = b.add(new N.Math({ op: "mul" }));
    b.connect(impact).to(effIntensity1, "a");
    b.connect(gi.intensity).to(effIntensity1, "b");
    const effIntensity = b.add(new N.Math({ op: "add" }));
    b.connect(gi.intensity).to(effIntensity, "a");
    b.connect(effIntensity1).to(effIntensity, "b");

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
    const off = (h: { nodeId: string; pin: string }) => {
      const h5 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
      b.connect(h).to(h5, "a");
      const h2v = b.add(new N.Math({ op: "mul" }), { b: 2 });
      b.connect(h5).to(h2v, "a");
      const hi = b.add(new N.Math({ op: "mul" }));
      b.connect(h2v).to(hi, "a");
      b.connect(effIntensity).to(hi, "b");
      const ho = b.add(new N.Math({ op: "mul" }), { b: 0.1 });
      b.connect(hi).to(ho, "a");
      return ho;
    };
    const offX = off(h1);
    const offY = off(h2);
    const offset = b.add(new N.CombineXy());
    b.connect(offX).to(offset, "x");
    b.connect(offY).to(offset, "y");

    // caDir = normalize(offset + tiny) · ca · 0.02
    const eps = b.add(new N.CombineXy());
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "x");
    b.connect(b.add(new N.Const({ value: 1e-5 }))).to(eps, "y");
    const offEps = b.add(new N.VectorMath({ op: "add" }));
    b.connect(offset).to(offEps, "a");
    b.connect(eps).to(offEps, "b");
    const caDir = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(offEps).to(caDir, "a");
    const caStr = b.add(new N.Math({ op: "mul" }), { b: 0.02 });
    b.connect(gi.chromaticAberration).to(caStr, "a");
    const caOff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(caDir).to(caOff, "a");
    b.connect(caStr).to(caOff, "b");

    const uvCenter = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(uvCenter, "a");
    b.connect(offset).to(uvCenter, "b");

    const uvR = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uvCenter).to(uvR, "a");
    b.connect(caOff).to(uvR, "b");
    const sampleR = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(uvR).to(sampleR, "uv");
    const sampleG = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(uvCenter).to(sampleG, "uv");
    const uvB = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uvCenter).to(uvB, "a");
    b.connect(caOff).to(uvB, "b");
    const sampleB = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(uvB).to(sampleB, "uv");

    const sepR = b.add(new N.SeparateColor());
    b.connect(sampleR, "color").to(sepR, "v");
    const sepG = b.add(new N.SeparateColor());
    b.connect(sampleG, "color").to(sepG, "v");
    const sepB = b.add(new N.SeparateColor());
    b.connect(sampleB, "color").to(sepB, "v");
    const out = b.add(new N.CombineColor());
    b.connect(sepR, "r").to(out, "r");
    b.connect(sepG, "g").to(out, "g");
    b.connect(sepB, "b").to(out, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(Shatter);
export default Shatter;
