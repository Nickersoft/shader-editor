// Bulge — graph-decomposed bulge / pinch around a center.
//   aspect = u_resolution.x / u_resolution.y
//   aspectUV = (uv.x · aspect, uv.y);   centerPos = (cx · aspect, 1 − cy)
//   delta = aspectUV − centerPos;   dist = length(delta)
//   effRadius = radius · 0.5
//   smoothFalloff = 1 − smoothstep(effRadius · max(1 − falloff − ε, 0), effRadius, dist)
//   quadFall = max(0, 1 − (dist / effRadius)²)
//   disp = −strength · smoothFalloff · quadFall
//   bulgedDelta = delta · (1 + disp)
//   finalUV = ((centerPos + bulgedDelta).x / aspect, (centerPos + bulgedDelta).y)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Bulge",
  description: "Magnify or pinch content around a center point",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Bulge extends ProceduralEffect {
  static readonly typeId = "bulge";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 1 },
      { id: "strength", type: "float", label: "Strength", default: 1 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // aspect = u_resolution.x / u_resolution.y
    const res = b.add(new N.Resolution(), undefined, "out");
    const splitRes = b.add(new N.SeparateXy());
    b.connect(res).to(splitRes, "v");
    const aspect = b.add(new N.Math({ op: "div" }));
    b.connect(splitRes, "x").to(aspect, "a");
    b.connect(splitRes, "y").to(aspect, "b");

    // aspectUV = vec2(uv.x · aspect, uv.y)
    const splitUv = b.add(new N.SeparateXy());
    b.connect(uv).to(splitUv, "v");
    const aspectX = b.add(new N.Math({ op: "mul" }));
    b.connect(splitUv, "x").to(aspectX, "a");
    b.connect(aspect).to(aspectX, "b");
    const aspectUv = b.add(new N.CombineXy());
    b.connect(aspectX).to(aspectUv, "x");
    b.connect(splitUv, "y").to(aspectUv, "y");

    // centerPos = vec2(cx · aspect, 1 − cy)
    const cAx = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.centerX).to(cAx, "a");
    b.connect(aspect).to(cAx, "b");
    const cAy = b.add(new N.Math({ op: "oneminus" }));
    b.connect(gi.centerY).to(cAy, "x");
    const centerPos = b.add(new N.CombineXy());
    b.connect(cAx).to(centerPos, "x");
    b.connect(cAy).to(centerPos, "y");

    const delta = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(aspectUv).to(delta, "a");
    b.connect(centerPos).to(delta, "b");

    const dist = b.add(new N.VectorMath({ op: "length" }));
    b.connect(delta).to(dist, "a");

    const half = b.add(new N.Const({ value: 0.5 }));
    const effR = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.radius).to(effR, "a");
    b.connect(half).to(effR, "b");

    // smoothFalloff = 1 − smoothstep(effR · max(1 − falloff − ε, 0), effR, dist)
    const epsV = b.add(new N.Const({ value: 0.001 }));
    const fallSh = b.add(new N.Math({ op: "sub" }));
    const oneV = b.add(new N.Const({ value: 1 }));
    b.connect(oneV).to(fallSh, "a");
    b.connect(gi.falloff).to(fallSh, "b");
    const fallShE = b.add(new N.Math({ op: "sub" }));
    b.connect(fallSh).to(fallShE, "a");
    b.connect(epsV).to(fallShE, "b");
    const zeroV = b.add(new N.Const({ value: 0 }));
    const innerEdgeMul = b.add(new N.Math({ op: "max" }));
    b.connect(fallShE).to(innerEdgeMul, "a");
    b.connect(zeroV).to(innerEdgeMul, "b");
    const innerEdge = b.add(new N.Math({ op: "mul" }));
    b.connect(effR).to(innerEdge, "a");
    b.connect(innerEdgeMul).to(innerEdge, "b");
    const ss = b.add(new N.Smoothstep());
    b.connect(innerEdge).to(ss, "edge0");
    b.connect(effR).to(ss, "edge1");
    b.connect(dist).to(ss, "x");
    const smoothFall = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(smoothFall, "x");

    // normDist = dist / effR;   quadFall = max(0, 1 − normDist²)
    const normDist = b.add(new N.Math({ op: "div" }));
    b.connect(dist).to(normDist, "a");
    b.connect(effR).to(normDist, "b");
    const nd2 = b.add(new N.Math({ op: "mul" }));
    b.connect(normDist).to(nd2, "a");
    b.connect(normDist).to(nd2, "b");
    const oneMinusNd2 = b.add(new N.Math({ op: "sub" }));
    b.connect(oneV).to(oneMinusNd2, "a");
    b.connect(nd2).to(oneMinusNd2, "b");
    const quadFall = b.add(new N.Math({ op: "max" }));
    b.connect(zeroV).to(quadFall, "a");
    b.connect(oneMinusNd2).to(quadFall, "b");

    // disp = −strength · smoothFall · quadFall
    const fTotal = b.add(new N.Math({ op: "mul" }));
    b.connect(smoothFall).to(fTotal, "a");
    b.connect(quadFall).to(fTotal, "b");
    const negStrength = b.add(new N.Math({ op: "neg" }));
    b.connect(gi.strength).to(negStrength, "x");
    const disp = b.add(new N.Math({ op: "mul" }));
    b.connect(negStrength).to(disp, "a");
    b.connect(fTotal).to(disp, "b");

    // bulgedDelta = delta · (1 + disp)
    const scaleFactor = b.add(new N.Math({ op: "add" }));
    b.connect(oneV).to(scaleFactor, "a");
    b.connect(disp).to(scaleFactor, "b");
    const bulgedDelta = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(delta).to(bulgedDelta, "a");
    b.connect(scaleFactor).to(bulgedDelta, "b");

    const bulgedUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(centerPos).to(bulgedUv, "a");
    b.connect(bulgedDelta).to(bulgedUv, "b");

    // finalUV = vec2(bulgedUv.x / aspect, bulgedUv.y)
    const splitB = b.add(new N.SeparateXy());
    b.connect(bulgedUv).to(splitB, "v");
    const finalX = b.add(new N.Math({ op: "div" }));
    b.connect(splitB, "x").to(finalX, "a");
    b.connect(aspect).to(finalX, "b");
    const finalUv = b.add(new N.CombineXy());
    b.connect(finalX).to(finalUv, "x");
    b.connect(splitB, "y").to(finalUv, "y");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Bulge);
export default Bulge;
