// Shatter — graph-decomposed. Per-cell vec2 jitter (two hashes); mouse
// impact boosts intensity inside an exponential falloff disc; final RGB
// pick from three channel-isolated samples with CA offset.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Shatter",
  description: "Voronoi-cell shatter with chromatic split",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class Shatter extends GraphEffectBase {
  static readonly typeId = "shatter";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "density", type: "float", label: "Density", default: 10 },
      { id: "chromaticAberration", type: "float", label: "Chromatic Aberration", default: 0.3 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const mouse = b.add("mouse", {}, undefined, "position");

    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const qx = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "x" }, qx.nodeId, "a");
    b.connect(gi.density, qx.nodeId, "b");
    const qy = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, qy.nodeId, "a");
    b.connect(gi.density, qy.nodeId, "b");
    const cellX1 = b.add("math", { op: "floor" });
    b.connect(qx, cellX1.nodeId, "x");
    const cellX = b.add("math", { op: "add" });
    b.connect(cellX1, cellX.nodeId, "a");
    b.connect(gi.seed, cellX.nodeId, "b");
    const cellY1 = b.add("math", { op: "floor" });
    b.connect(qy, cellY1.nodeId, "x");
    const cellY = b.add("math", { op: "add" });
    b.connect(cellY1, cellY.nodeId, "a");
    b.connect(gi.seed, cellY.nodeId, "b");

    // mouseImpact = exp(−distance(uv, mouse) · 6)
    const dist = b.add("vector-math", { op: "distance" });
    b.connect(uv, dist.nodeId, "a");
    b.connect(mouse, dist.nodeId, "b");
    const dist6 = b.add("math", { op: "mul" }, { b: 6 });
    b.connect(dist, dist6.nodeId, "a");
    const negDist = b.add("math", { op: "neg" });
    b.connect(dist6, negDist.nodeId, "x");
    const impact = b.add("math", { op: "exp" });
    b.connect(negDist, impact.nodeId, "x");
    const effIntensity1 = b.add("math", { op: "mul" });
    b.connect(impact, effIntensity1.nodeId, "a");
    b.connect(gi.intensity, effIntensity1.nodeId, "b");
    const effIntensity = b.add("math", { op: "add" });
    b.connect(gi.intensity, effIntensity.nodeId, "a");
    b.connect(effIntensity1, effIntensity.nodeId, "b");

    const c1 = b.add("combine-xy", {});
    b.connect(cellX, c1.nodeId, "x");
    b.connect(cellY, c1.nodeId, "y");
    const h1 = b.add("white-noise-texture", {});
    b.connect(c1, h1.nodeId, "p");
    const c2 = b.add("combine-xy", {});
    b.connect(cellY, c2.nodeId, "x");
    b.connect(cellX, c2.nodeId, "y");
    const h2 = b.add("white-noise-texture", {});
    b.connect(c2, h2.nodeId, "p");
    const off = (h: { nodeId: string; pin: string }) => {
      const h5 = b.add("math", { op: "sub" }, { b: 0.5 });
      b.connect(h, h5.nodeId, "a");
      const h2v = b.add("math", { op: "mul" }, { b: 2 });
      b.connect(h5, h2v.nodeId, "a");
      const hi = b.add("math", { op: "mul" });
      b.connect(h2v, hi.nodeId, "a");
      b.connect(effIntensity, hi.nodeId, "b");
      const ho = b.add("math", { op: "mul" }, { b: 0.1 });
      b.connect(hi, ho.nodeId, "a");
      return ho;
    };
    const offX = off(h1);
    const offY = off(h2);
    const offset = b.add("combine-xy", {});
    b.connect(offX, offset.nodeId, "x");
    b.connect(offY, offset.nodeId, "y");

    // caDir = normalize(offset + tiny) · ca · 0.02
    const eps = b.add("combine-xy", {});
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "x");
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "y");
    const offEps = b.add("vector-math", { op: "add" });
    b.connect(offset, offEps.nodeId, "a");
    b.connect(eps, offEps.nodeId, "b");
    const caDir = b.add("vector-math", { op: "normalize" });
    b.connect(offEps, caDir.nodeId, "a");
    const caStr = b.add("math", { op: "mul" }, { b: 0.02 });
    b.connect(gi.chromaticAberration, caStr.nodeId, "a");
    const caOff = b.add("vector-math", { op: "scale" });
    b.connect(caDir, caOff.nodeId, "a");
    b.connect(caStr, caOff.nodeId, "b");

    const uvCenter = b.add("vector-math", { op: "add" });
    b.connect(uv, uvCenter.nodeId, "a");
    b.connect(offset, uvCenter.nodeId, "b");

    const uvR = b.add("vector-math", { op: "add" });
    b.connect(uvCenter, uvR.nodeId, "a");
    b.connect(caOff, uvR.nodeId, "b");
    const sampleR = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(uvR, sampleR.nodeId, "uv");
    const sampleG = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(uvCenter, sampleG.nodeId, "uv");
    const uvB = b.add("vector-math", { op: "sub" });
    b.connect(uvCenter, uvB.nodeId, "a");
    b.connect(caOff, uvB.nodeId, "b");
    const sampleB = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(uvB, sampleB.nodeId, "uv");

    const sepR = b.add("separate-color", {});
    b.connect({ nodeId: sampleR.nodeId, pin: "color" }, sepR.nodeId, "v");
    const sepG = b.add("separate-color", {});
    b.connect({ nodeId: sampleG.nodeId, pin: "color" }, sepG.nodeId, "v");
    const sepB = b.add("separate-color", {});
    b.connect({ nodeId: sampleB.nodeId, pin: "color" }, sepB.nodeId, "v");
    const out = b.add("combine-color", {});
    b.connect({ nodeId: sepR.nodeId, pin: "r" }, out.nodeId, "r");
    b.connect({ nodeId: sepG.nodeId, pin: "g" }, out.nodeId, "g");
    b.connect({ nodeId: sepB.nodeId, pin: "b" }, out.nodeId, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(Shatter);
export default Shatter;
