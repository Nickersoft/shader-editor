// Crystal — graph-decomposed. Per-cell vec2 offset from two independent
// hashes (cell.x as x-coord, cell.y as y-coord to decorrelate); three
// channel-isolated samples with CA offset; an edge-rim term added from the
// per-cell fract distance.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Crystal",
  description: "Crystalline faceted refraction",
  color: "#a78bfa",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Crystal extends GraphEffectBase {
  static readonly typeId = "crystal";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "facets", type: "float", label: "Facets", default: 8 },
      { id: "chromaticAberration", type: "float", label: "Chromatic Aberration", default: 0.3 },
      { id: "fresnel", type: "float", label: "Fresnel", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // q = uv · facets; cell = floor(q); fpos = fract(q)
    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const qx = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "x" }, qx.nodeId, "a");
    b.connect(gi.facets, qx.nodeId, "b");
    const qy = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, qy.nodeId, "a");
    b.connect(gi.facets, qy.nodeId, "b");
    const cellX = b.add("math", { op: "floor" });
    b.connect(qx, cellX.nodeId, "x");
    const cellY = b.add("math", { op: "floor" });
    b.connect(qy, cellY.nodeId, "x");
    const fposX = b.add("math", { op: "fract" });
    b.connect(qx, fposX.nodeId, "x");
    const fposY = b.add("math", { op: "fract" });
    b.connect(qy, fposY.nodeId, "x");

    // Two hashes per cell to make a vec2: hash(vec2(cell.x, cell.y)) and
    // hash(vec2(cell.y, cell.x)) decorrelate.
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

    // offset = (h − 0.5) · 2 · intensity · 0.05
    const off = (h: { nodeId: string; pin: string }) => {
      const h5 = b.add("math", { op: "sub" }, { b: 0.5 });
      b.connect(h, h5.nodeId, "a");
      const h2v = b.add("math", { op: "mul" }, { b: 2 });
      b.connect(h5, h2v.nodeId, "a");
      const hi = b.add("math", { op: "mul" });
      b.connect(h2v, hi.nodeId, "a");
      b.connect(gi.intensity, hi.nodeId, "b");
      const ho = b.add("math", { op: "mul" }, { b: 0.05 });
      b.connect(hi, ho.nodeId, "a");
      return ho;
    };
    const offX = off(h1);
    const offY = off(h2);
    const offset = b.add("combine-xy", {});
    b.connect(offX, offset.nodeId, "x");
    b.connect(offY, offset.nodeId, "y");

    // caDir = normalize(offset + tiny) · ca · 0.015
    const eps = b.add("combine-xy", {});
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "x");
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "y");
    const offEps = b.add("vector-math", { op: "add" });
    b.connect(offset, offEps.nodeId, "a");
    b.connect(eps, offEps.nodeId, "b");
    const caDir = b.add("vector-math", { op: "normalize" });
    b.connect(offEps, caDir.nodeId, "a");
    const caStr = b.add("math", { op: "mul" }, { b: 0.015 });
    b.connect(gi.chromaticAberration, caStr.nodeId, "a");
    const caOff = b.add("vector-math", { op: "scale" });
    b.connect(caDir, caOff.nodeId, "a");
    b.connect(caStr, caOff.nodeId, "b");

    // Sample R/G/B at uv + offset ± caOff.
    const uvCenter = b.add("vector-math", { op: "add" });
    b.connect(uv, uvCenter.nodeId, "a");
    b.connect(offset, uvCenter.nodeId, "b");

    const uvR = b.add("vector-math", { op: "add" });
    b.connect(uvCenter, uvR.nodeId, "a");
    b.connect(caOff, uvR.nodeId, "b");
    const sampleR = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvR, sampleR.nodeId, "uv");

    const sampleG = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvCenter, sampleG.nodeId, "uv");

    const uvB = b.add("vector-math", { op: "sub" });
    b.connect(uvCenter, uvB.nodeId, "a");
    b.connect(caOff, uvB.nodeId, "b");
    const sampleB = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvB, sampleB.nodeId, "uv");

    const sepR = b.add("separate-color", {});
    b.connect({ nodeId: sampleR.nodeId, pin: "color" }, sepR.nodeId, "v");
    const sepG = b.add("separate-color", {});
    b.connect({ nodeId: sampleG.nodeId, pin: "color" }, sepG.nodeId, "v");
    const sepB = b.add("separate-color", {});
    b.connect({ nodeId: sampleB.nodeId, pin: "color" }, sepB.nodeId, "v");
    const col = b.add("combine-color", {});
    b.connect({ nodeId: sepR.nodeId, pin: "r" }, col.nodeId, "r");
    b.connect({ nodeId: sepG.nodeId, pin: "g" }, col.nodeId, "g");
    b.connect({ nodeId: sepB.nodeId, pin: "b" }, col.nodeId, "b");

    // edgeDist = min(fpos, 1 − fpos) — take min of x and y components.
    const oneMinusX = b.add("math", { op: "oneminus" });
    b.connect(fposX, oneMinusX.nodeId, "x");
    const oneMinusY = b.add("math", { op: "oneminus" });
    b.connect(fposY, oneMinusY.nodeId, "x");
    const minX = b.add("math", { op: "min" });
    b.connect(fposX, minX.nodeId, "a");
    b.connect(oneMinusX, minX.nodeId, "b");
    const minY = b.add("math", { op: "min" });
    b.connect(fposY, minY.nodeId, "a");
    b.connect(oneMinusY, minY.nodeId, "b");
    const edgeMin = b.add("math", { op: "min" });
    b.connect(minX, edgeMin.nodeId, "a");
    b.connect(minY, edgeMin.nodeId, "b");
    const rim = b.add("smoothstep", {}, { edge0: 0, edge1: 0.15 });
    b.connect(edgeMin, rim.nodeId, "x");
    const rimInv = b.add("math", { op: "oneminus" });
    b.connect(rim, rimInv.nodeId, "x");
    const rimF = b.add("math", { op: "mul" });
    b.connect(rimInv, rimF.nodeId, "a");
    b.connect(gi.fresnel, rimF.nodeId, "b");
    const out = b.add("color-math", { op: "addScalar" });
    b.connect(col, out.nodeId, "a");
    b.connect(rimF, out.nodeId, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(Crystal);
export default Crystal;
