// GridDistortion — graph-decomposed. Mesh-style simplex jitter on uv, with
// an extra mouse-tracked pull whose strength scales with mouse velocity.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Grid Distortion",
  description: "Mesh-style noise warp",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class GridDistortion extends GraphEffectBase {
  static readonly typeId = "grid-distortion";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Amount", default: 0.05 },
      { id: "scale", type: "float", label: "Scale", default: 4 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "decay", type: "float", label: "Decay", default: 0.9 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");
    const mousePos = b.add("mouse", {}, undefined, "position");
    const mouseDelta = b.add("mouse", {}, undefined, "delta");

    // ts = t · speed
    const ts = b.add("math", { op: "mul" });
    b.connect(t, ts.nodeId, "a");
    b.connect(gi.speed, ts.nodeId, "b");

    // q = uv · scale
    const q = b.add("vector-math", { op: "scale" });
    b.connect(uv, q.nodeId, "a");
    b.connect(gi.scale, q.nodeId, "b");

    // qPlus = q + vec2(ts, ts)
    const tsV = b.add("combine-xy", {});
    b.connect(ts, tsV.nodeId, "x");
    b.connect(ts, tsV.nodeId, "y");
    const qPlus1 = b.add("vector-math", { op: "add" });
    b.connect(q, qPlus1.nodeId, "a");
    b.connect(tsV, qPlus1.nodeId, "b");

    // nx = simplex2D(qPlus1)
    const nx = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(qPlus1, nx.nodeId, "p");
    // remap to [-1, 1]
    const nx2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(nx, nx2.nodeId, "a");
    const nxS = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(nx2, nxS.nodeId, "a");

    // qPlus2 = q + vec2(ts + 13.7, ts + 13.7)
    const ts137 = b.add("math", { op: "add" }, { b: 13.7 });
    b.connect(ts, ts137.nodeId, "a");
    const tsV2 = b.add("combine-xy", {});
    b.connect(ts137, tsV2.nodeId, "x");
    b.connect(ts137, tsV2.nodeId, "y");
    const qPlus2 = b.add("vector-math", { op: "add" });
    b.connect(q, qPlus2.nodeId, "a");
    b.connect(tsV2, qPlus2.nodeId, "b");

    const ny = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(qPlus2, ny.nodeId, "p");
    const ny2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(ny, ny2.nodeId, "a");
    const nyS = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(ny2, nyS.nodeId, "a");

    // offset = vec2(nxS, nyS) · amount · decay
    const offV = b.add("combine-xy", {});
    b.connect(nxS, offV.nodeId, "x");
    b.connect(nyS, offV.nodeId, "y");
    const amDec = b.add("math", { op: "mul" });
    b.connect(gi.amount, amDec.nodeId, "a");
    b.connect(gi.decay, amDec.nodeId, "b");
    const noiseOff = b.add("vector-math", { op: "scale" });
    b.connect(offV, noiseOff.nodeId, "a");
    b.connect(amDec, noiseOff.nodeId, "b");

    // mousePush = exp(−distance(uv, mouse) · 4)
    const dist = b.add("vector-math", { op: "distance" });
    b.connect(uv, dist.nodeId, "a");
    b.connect(mousePos, dist.nodeId, "b");
    const dist4 = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(dist, dist4.nodeId, "a");
    const negDist = b.add("math", { op: "neg" });
    b.connect(dist4, negDist.nodeId, "x");
    const mousePush = b.add("math", { op: "exp" });
    b.connect(negDist, mousePush.nodeId, "x");

    // mouseTerm = (uv − mouse) · mousePush · length(mouseDelta) · 5
    const toMouse = b.add("vector-math", { op: "sub" });
    b.connect(uv, toMouse.nodeId, "a");
    b.connect(mousePos, toMouse.nodeId, "b");
    const mdLen = b.add("vector-math", { op: "length" });
    b.connect(mouseDelta, mdLen.nodeId, "a");
    const mdLen5 = b.add("math", { op: "mul" }, { b: 5 });
    b.connect(mdLen, mdLen5.nodeId, "a");
    const pushScale = b.add("math", { op: "mul" });
    b.connect(mousePush, pushScale.nodeId, "a");
    b.connect(mdLen5, pushScale.nodeId, "b");
    const mouseTerm = b.add("vector-math", { op: "scale" });
    b.connect(toMouse, mouseTerm.nodeId, "a");
    b.connect(pushScale, mouseTerm.nodeId, "b");

    // finalUV = uv + noiseOff + mouseTerm
    const add1 = b.add("vector-math", { op: "add" });
    b.connect(uv, add1.nodeId, "a");
    b.connect(noiseOff, add1.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(add1, finalUv.nodeId, "a");
    b.connect(mouseTerm, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(GridDistortion);
export default GridDistortion;
