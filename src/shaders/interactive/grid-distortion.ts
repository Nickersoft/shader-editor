// GridDistortion — graph-decomposed. Mesh-style simplex jitter on uv, with
// an extra mouse-tracked pull whose strength scales with mouse velocity.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Grid Distortion",
  description: "Mesh-style noise warp",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class GridDistortion extends ProceduralEffect {
  static readonly typeId = "grid-distortion";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Amount", default: 0.05 },
      { id: "scale", type: "float", label: "Scale", default: 4 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "decay", type: "float", label: "Decay", default: 0.9 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");
    const mousePos = b.add(new N.Mouse(), undefined, "position");
    const mouseDelta = b.add(new N.Mouse(), undefined, "delta");

    // ts = t · speed
    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(ts, "a");
    b.connect(gi.speed).to(ts, "b");

    // q = uv · scale
    const q = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(q, "a");
    b.connect(gi.scale).to(q, "b");

    // qPlus = q + vec2(ts, ts)
    const tsV = b.add(new N.CombineXy());
    b.connect(ts).to(tsV, "x");
    b.connect(ts).to(tsV, "y");
    const qPlus1 = b.add(new N.VectorMath({ op: "add" }));
    b.connect(q).to(qPlus1, "a");
    b.connect(tsV).to(qPlus1, "b");

    // nx = simplex2D(qPlus1)
    const nx = b.add(new N.NoiseTexture({
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(qPlus1).to(nx, "p");
    // remap to [-1, 1]
    const nx2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(nx).to(nx2, "a");
    const nxS = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(nx2).to(nxS, "a");

    // qPlus2 = q + vec2(ts + 13.7, ts + 13.7)
    const ts137 = b.add(new N.Math({ op: "add" }), { b: 13.7 });
    b.connect(ts).to(ts137, "a");
    const tsV2 = b.add(new N.CombineXy());
    b.connect(ts137).to(tsV2, "x");
    b.connect(ts137).to(tsV2, "y");
    const qPlus2 = b.add(new N.VectorMath({ op: "add" }));
    b.connect(q).to(qPlus2, "a");
    b.connect(tsV2).to(qPlus2, "b");

    const ny = b.add(new N.NoiseTexture({
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(qPlus2).to(ny, "p");
    const ny2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(ny).to(ny2, "a");
    const nyS = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(ny2).to(nyS, "a");

    // offset = vec2(nxS, nyS) · amount · decay
    const offV = b.add(new N.CombineXy());
    b.connect(nxS).to(offV, "x");
    b.connect(nyS).to(offV, "y");
    const amDec = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.amount).to(amDec, "a");
    b.connect(gi.decay).to(amDec, "b");
    const noiseOff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(offV).to(noiseOff, "a");
    b.connect(amDec).to(noiseOff, "b");

    // mousePush = exp(−distance(uv, mouse) · 4)
    const dist = b.add(new N.VectorMath({ op: "distance" }));
    b.connect(uv).to(dist, "a");
    b.connect(mousePos).to(dist, "b");
    const dist4 = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(dist).to(dist4, "a");
    const negDist = b.add(new N.Math({ op: "neg" }));
    b.connect(dist4).to(negDist, "x");
    const mousePush = b.add(new N.Math({ op: "exp" }));
    b.connect(negDist).to(mousePush, "x");

    // mouseTerm = (uv − mouse) · mousePush · length(mouseDelta) · 5
    const toMouse = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(toMouse, "a");
    b.connect(mousePos).to(toMouse, "b");
    const mdLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(mouseDelta).to(mdLen, "a");
    const mdLen5 = b.add(new N.Math({ op: "mul" }), { b: 5 });
    b.connect(mdLen).to(mdLen5, "a");
    const pushScale = b.add(new N.Math({ op: "mul" }));
    b.connect(mousePush).to(pushScale, "a");
    b.connect(mdLen5).to(pushScale, "b");
    const mouseTerm = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(toMouse).to(mouseTerm, "a");
    b.connect(pushScale).to(mouseTerm, "b");

    // finalUV = uv + noiseOff + mouseTerm
    const add1 = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(add1, "a");
    b.connect(noiseOff).to(add1, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(add1).to(finalUv, "a");
    b.connect(mouseTerm).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(GridDistortion);
export default GridDistortion;
