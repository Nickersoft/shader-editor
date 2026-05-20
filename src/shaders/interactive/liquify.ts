// Liquify — graph-decomposed. Two simplex samples drive a vec2 jitter on
// `uv`; an additional mouse-tracked pull adds a soft warp around the cursor
// that grows with mouse velocity.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");
    const mousePos = b.add(new N.Mouse(), undefined, "position");
    const mouseDelta = b.add(new N.Mouse(), undefined, "delta");

    // effScale = scale · mix(2.0, 0.5, stiffness)
    const stiffMix = b.add(new N.Math({ op: "mix" }), { a: 2, b: 0.5 });
    b.connect(gi.stiffness).to(stiffMix, "c");
    const effScale = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.scale).to(effScale, "a");
    b.connect(stiffMix).to(effScale, "b");

    // effAmount = amount · mix(1.5, 0.5, damping)
    const dampMix = b.add(new N.Math({ op: "mix" }), { a: 1.5, b: 0.5 });
    b.connect(gi.damping).to(dampMix, "c");
    const effAmount = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.amount).to(effAmount, "a");
    b.connect(dampMix).to(effAmount, "b");

    // ts = t · speed
    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(ts, "a");
    b.connect(gi.speed).to(ts, "b");

    // pScale = uv · effScale
    const pScale = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(pScale, "a");
    b.connect(effScale).to(pScale, "b");

    // dx sample at pScale + vec2(ts, 0)
    const tsX = b.add(new N.CombineXy(), { y: 0 });
    b.connect(ts).to(tsX, "x");
    const dxP = b.add(new N.VectorMath({ op: "add" }));
    b.connect(pScale).to(dxP, "a");
    b.connect(tsX).to(dxP, "b");
    const dxN = b.add(new N.NoiseTexture({
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(dxP).to(dxN, "p");
    // dxN is in [0,1]; remap to [-1,1] to match raw simplex
    const dx2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(dxN).to(dx2, "a");
    const dx = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(dx2).to(dx, "a");

    // dy sample at pScale + vec2(0, ts + 7.3)
    const tsPlus = b.add(new N.Math({ op: "add" }), { b: 7.3 });
    b.connect(ts).to(tsPlus, "a");
    const tsY = b.add(new N.CombineXy(), { x: 0 });
    b.connect(tsPlus).to(tsY, "y");
    const dyP = b.add(new N.VectorMath({ op: "add" }));
    b.connect(pScale).to(dyP, "a");
    b.connect(tsY).to(dyP, "b");
    const dyN = b.add(new N.NoiseTexture({
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(dyP).to(dyN, "p");
    const dy2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(dyN).to(dy2, "a");
    const dy = b.add(new N.Math({ op: "sub" }), { b: 1 });
    b.connect(dy2).to(dy, "a");

    // jitter = vec2(dx, dy) * effAmount
    const jitter = b.add(new N.CombineXy());
    b.connect(dx).to(jitter, "x");
    b.connect(dy).to(jitter, "y");
    const jitterScaled = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(jitter).to(jitterScaled, "a");
    b.connect(effAmount).to(jitterScaled, "b");

    // toMouse = uv − mouse
    const toMouse = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(toMouse, "a");
    b.connect(mousePos).to(toMouse, "b");

    // mouseFalloff = exp(−length(toMouse) · 4)
    const tmLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(toMouse).to(tmLen, "a");
    const tmLen4 = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(tmLen).to(tmLen4, "a");
    const tmNeg = b.add(new N.Math({ op: "neg" }));
    b.connect(tmLen4).to(tmNeg, "x");
    const falloff = b.add(new N.Math({ op: "exp" }));
    b.connect(tmNeg).to(falloff, "x");

    // mouseSpeed = length(mouseDelta) · 2
    const mdLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(mouseDelta).to(mdLen, "a");
    const mdLen2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(mdLen).to(mdLen2, "a");

    // mousePull = toMouse · falloff · mouseSpeed
    const pull1 = b.add(new N.Math({ op: "mul" }));
    b.connect(falloff).to(pull1, "a");
    b.connect(mdLen2).to(pull1, "b");
    const mousePull = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(toMouse).to(mousePull, "a");
    b.connect(pull1).to(mousePull, "b");

    // finalUV = uv + jitterScaled + mousePull
    const add1 = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(add1, "a");
    b.connect(jitterScaled).to(add1, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(add1).to(finalUv, "a");
    b.connect(mousePull).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Liquify);
export default Liquify;
