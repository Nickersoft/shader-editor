// Liquify — graph-decomposed. Two simplex samples drive a vec2 jitter on
// `uv`; an additional mouse-tracked pull adds a soft warp around the cursor
// that grows with mouse velocity.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Liquify",
  description: "Soft noise-driven liquid warp",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class Liquify extends ProceduralEffect {
  static readonly typeId = "liquify";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Amount", default: 0.05 },
      { id: "scale", type: "float", label: "Scale", default: 3 },
      { id: "speed", type: "float", label: "Speed", default: 0.5 },
      { id: "stiffness", type: "float", label: "Stiffness", default: 0.5 },
      { id: "damping", type: "float", label: "Damping", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");
    const mousePos = b.add("mouse", {}, undefined, "position");
    const mouseDelta = b.add("mouse", {}, undefined, "delta");

    // effScale = scale · mix(2.0, 0.5, stiffness)
    const stiffMix = b.add("math", { op: "mix" }, { a: 2, b: 0.5 });
    b.connect(gi.stiffness, stiffMix.nodeId, "c");
    const effScale = b.add("math", { op: "mul" });
    b.connect(gi.scale, effScale.nodeId, "a");
    b.connect(stiffMix, effScale.nodeId, "b");

    // effAmount = amount · mix(1.5, 0.5, damping)
    const dampMix = b.add("math", { op: "mix" }, { a: 1.5, b: 0.5 });
    b.connect(gi.damping, dampMix.nodeId, "c");
    const effAmount = b.add("math", { op: "mul" });
    b.connect(gi.amount, effAmount.nodeId, "a");
    b.connect(dampMix, effAmount.nodeId, "b");

    // ts = t · speed
    const ts = b.add("math", { op: "mul" });
    b.connect(t, ts.nodeId, "a");
    b.connect(gi.speed, ts.nodeId, "b");

    // pScale = uv · effScale
    const pScale = b.add("vector-math", { op: "scale" });
    b.connect(uv, pScale.nodeId, "a");
    b.connect(effScale, pScale.nodeId, "b");

    // dx sample at pScale + vec2(ts, 0)
    const tsX = b.add("combine-xy", {}, { y: 0 });
    b.connect(ts, tsX.nodeId, "x");
    const dxP = b.add("vector-math", { op: "add" });
    b.connect(pScale, dxP.nodeId, "a");
    b.connect(tsX, dxP.nodeId, "b");
    const dxN = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(dxP, dxN.nodeId, "p");
    // dxN is in [0,1]; remap to [-1,1] to match raw simplex
    const dx2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(dxN, dx2.nodeId, "a");
    const dx = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(dx2, dx.nodeId, "a");

    // dy sample at pScale + vec2(0, ts + 7.3)
    const tsPlus = b.add("math", { op: "add" }, { b: 7.3 });
    b.connect(ts, tsPlus.nodeId, "a");
    const tsY = b.add("combine-xy", {}, { x: 0 });
    b.connect(tsPlus, tsY.nodeId, "y");
    const dyP = b.add("vector-math", { op: "add" });
    b.connect(pScale, dyP.nodeId, "a");
    b.connect(tsY, dyP.nodeId, "b");
    const dyN = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(dyP, dyN.nodeId, "p");
    const dy2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(dyN, dy2.nodeId, "a");
    const dy = b.add("math", { op: "sub" }, { b: 1 });
    b.connect(dy2, dy.nodeId, "a");

    // jitter = vec2(dx, dy) * effAmount
    const jitter = b.add("combine-xy", {});
    b.connect(dx, jitter.nodeId, "x");
    b.connect(dy, jitter.nodeId, "y");
    const jitterScaled = b.add("vector-math", { op: "scale" });
    b.connect(jitter, jitterScaled.nodeId, "a");
    b.connect(effAmount, jitterScaled.nodeId, "b");

    // toMouse = uv − mouse
    const toMouse = b.add("vector-math", { op: "sub" });
    b.connect(uv, toMouse.nodeId, "a");
    b.connect(mousePos, toMouse.nodeId, "b");

    // mouseFalloff = exp(−length(toMouse) · 4)
    const tmLen = b.add("vector-math", { op: "length" });
    b.connect(toMouse, tmLen.nodeId, "a");
    const tmLen4 = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(tmLen, tmLen4.nodeId, "a");
    const tmNeg = b.add("math", { op: "neg" });
    b.connect(tmLen4, tmNeg.nodeId, "x");
    const falloff = b.add("math", { op: "exp" });
    b.connect(tmNeg, falloff.nodeId, "x");

    // mouseSpeed = length(mouseDelta) · 2
    const mdLen = b.add("vector-math", { op: "length" });
    b.connect(mouseDelta, mdLen.nodeId, "a");
    const mdLen2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(mdLen, mdLen2.nodeId, "a");

    // mousePull = toMouse · falloff · mouseSpeed
    const pull1 = b.add("math", { op: "mul" });
    b.connect(falloff, pull1.nodeId, "a");
    b.connect(mdLen2, pull1.nodeId, "b");
    const mousePull = b.add("vector-math", { op: "scale" });
    b.connect(toMouse, mousePull.nodeId, "a");
    b.connect(pull1, mousePull.nodeId, "b");

    // finalUV = uv + jitterScaled + mousePull
    const add1 = b.add("vector-math", { op: "add" });
    b.connect(uv, add1.nodeId, "a");
    b.connect(jitterScaled, add1.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(add1, finalUv.nodeId, "a");
    b.connect(mousePull, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Liquify);
export default Liquify;
