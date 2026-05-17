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
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // aspect = u_resolution.x / u_resolution.y
    const res = b.add("resolution", {}, undefined, "out");
    const splitRes = b.add("separate-xy", {});
    b.connect(res, splitRes.nodeId, "v");
    const aspect = b.add("math", { op: "div" });
    b.connect({ nodeId: splitRes.nodeId, pin: "x" }, aspect.nodeId, "a");
    b.connect({ nodeId: splitRes.nodeId, pin: "y" }, aspect.nodeId, "b");

    // aspectUV = vec2(uv.x · aspect, uv.y)
    const splitUv = b.add("separate-xy", {});
    b.connect(uv, splitUv.nodeId, "v");
    const aspectX = b.add("math", { op: "mul" });
    b.connect({ nodeId: splitUv.nodeId, pin: "x" }, aspectX.nodeId, "a");
    b.connect(aspect, aspectX.nodeId, "b");
    const aspectUv = b.add("combine-xy", {});
    b.connect(aspectX, aspectUv.nodeId, "x");
    b.connect({ nodeId: splitUv.nodeId, pin: "y" }, aspectUv.nodeId, "y");

    // centerPos = vec2(cx · aspect, 1 − cy)
    const cAx = b.add("math", { op: "mul" });
    b.connect(gi.centerX, cAx.nodeId, "a");
    b.connect(aspect, cAx.nodeId, "b");
    const cAy = b.add("math", { op: "oneminus" });
    b.connect(gi.centerY, cAy.nodeId, "x");
    const centerPos = b.add("combine-xy", {});
    b.connect(cAx, centerPos.nodeId, "x");
    b.connect(cAy, centerPos.nodeId, "y");

    const delta = b.add("vector-math", { op: "sub" });
    b.connect(aspectUv, delta.nodeId, "a");
    b.connect(centerPos, delta.nodeId, "b");

    const dist = b.add("vector-math", { op: "length" });
    b.connect(delta, dist.nodeId, "a");

    const half = b.add("value", { value: 0.5 });
    const effR = b.add("math", { op: "mul" });
    b.connect(gi.radius, effR.nodeId, "a");
    b.connect(half, effR.nodeId, "b");

    // smoothFalloff = 1 − smoothstep(effR · max(1 − falloff − ε, 0), effR, dist)
    const epsV = b.add("value", { value: 0.001 });
    const fallSh = b.add("math", { op: "sub" });
    const oneV = b.add("value", { value: 1 });
    b.connect(oneV, fallSh.nodeId, "a");
    b.connect(gi.falloff, fallSh.nodeId, "b");
    const fallShE = b.add("math", { op: "sub" });
    b.connect(fallSh, fallShE.nodeId, "a");
    b.connect(epsV, fallShE.nodeId, "b");
    const zeroV = b.add("value", { value: 0 });
    const innerEdgeMul = b.add("math", { op: "max" });
    b.connect(fallShE, innerEdgeMul.nodeId, "a");
    b.connect(zeroV, innerEdgeMul.nodeId, "b");
    const innerEdge = b.add("math", { op: "mul" });
    b.connect(effR, innerEdge.nodeId, "a");
    b.connect(innerEdgeMul, innerEdge.nodeId, "b");
    const ss = b.add("smoothstep", {});
    b.connect(innerEdge, ss.nodeId, "edge0");
    b.connect(effR, ss.nodeId, "edge1");
    b.connect(dist, ss.nodeId, "x");
    const smoothFall = b.add("math", { op: "oneminus" });
    b.connect(ss, smoothFall.nodeId, "x");

    // normDist = dist / effR;   quadFall = max(0, 1 − normDist²)
    const normDist = b.add("math", { op: "div" });
    b.connect(dist, normDist.nodeId, "a");
    b.connect(effR, normDist.nodeId, "b");
    const nd2 = b.add("math", { op: "mul" });
    b.connect(normDist, nd2.nodeId, "a");
    b.connect(normDist, nd2.nodeId, "b");
    const oneMinusNd2 = b.add("math", { op: "sub" });
    b.connect(oneV, oneMinusNd2.nodeId, "a");
    b.connect(nd2, oneMinusNd2.nodeId, "b");
    const quadFall = b.add("math", { op: "max" });
    b.connect(zeroV, quadFall.nodeId, "a");
    b.connect(oneMinusNd2, quadFall.nodeId, "b");

    // disp = −strength · smoothFall · quadFall
    const fTotal = b.add("math", { op: "mul" });
    b.connect(smoothFall, fTotal.nodeId, "a");
    b.connect(quadFall, fTotal.nodeId, "b");
    const negStrength = b.add("math", { op: "neg" });
    b.connect(gi.strength, negStrength.nodeId, "x");
    const disp = b.add("math", { op: "mul" });
    b.connect(negStrength, disp.nodeId, "a");
    b.connect(fTotal, disp.nodeId, "b");

    // bulgedDelta = delta · (1 + disp)
    const scaleFactor = b.add("math", { op: "add" });
    b.connect(oneV, scaleFactor.nodeId, "a");
    b.connect(disp, scaleFactor.nodeId, "b");
    const bulgedDelta = b.add("vector-math", { op: "scale" });
    b.connect(delta, bulgedDelta.nodeId, "a");
    b.connect(scaleFactor, bulgedDelta.nodeId, "b");

    const bulgedUv = b.add("vector-math", { op: "add" });
    b.connect(centerPos, bulgedUv.nodeId, "a");
    b.connect(bulgedDelta, bulgedUv.nodeId, "b");

    // finalUV = vec2(bulgedUv.x / aspect, bulgedUv.y)
    const splitB = b.add("separate-xy", {});
    b.connect(bulgedUv, splitB.nodeId, "v");
    const finalX = b.add("math", { op: "div" });
    b.connect({ nodeId: splitB.nodeId, pin: "x" }, finalX.nodeId, "a");
    b.connect(aspect, finalX.nodeId, "b");
    const finalUv = b.add("combine-xy", {});
    b.connect(finalX, finalUv.nodeId, "x");
    b.connect({ nodeId: splitB.nodeId, pin: "y" }, finalUv.nodeId, "y");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Bulge);
export default Bulge;
