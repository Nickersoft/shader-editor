// FlowField — graph-decomposed distortion.
//   offset = vec2(simplex(uv·5·detail + t), simplex(uv·5·detail + 7.3 + t)) · intensity · 0.1
//   finalUV = uv + offset
//
// The two simplex samples use the noise-texture primitive in `simplex` mode;
// the offset y-channel adds 7.3 to its sample point to de-correlate the two
// channels (matching the bespoke effect's hand-tuned offset).

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Flow Field",
  description: "Fluid-like distortion with constant smooth motion",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class FlowField extends ProceduralEffect {
  static readonly typeId = "flow-field";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "detail", type: "float", label: "Detail", default: 1 },
      { id: "evolutionSpeed", type: "float", label: "Evolution Speed", default: 0.3 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.time();

    // animT = t · evolutionSpeed
    const animT = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(animT, "a");
    b.connect(gi.evolutionSpeed).to(animT, "b");

    // scaledUV = uv · 5 · detail
    const five = b.add(new N.Const({ value: 5 }));
    const scale = b.add(new N.Math({ op: "mul" }));
    b.connect(five).to(scale, "a");
    b.connect(gi.detail).to(scale, "b");
    const scaledUV = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(scaledUV, "a");
    b.connect(scale).to(scaledUV, "b");

    // simplex sample x: uses noise-texture primitive with p = scaledUV, t = animT.
    const nX = b.add(new N.NoiseTexture({
      kind: "simplex",
      scale: 1,
      detail: 1,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    }));
    b.connect(scaledUV).to(nX, "p");
    b.connect(animT).to(nX, "t");

    // simplex sample y: same uv but t-input offset by 7.3 to de-correlate.
    const off = b.add(new N.Const({ value: 7.3 }));
    const tY = b.add(new N.Math({ op: "add" }));
    b.connect(animT).to(tY, "a");
    b.connect(off).to(tY, "b");
    const nY = b.add(new N.NoiseTexture({
      kind: "simplex",
      scale: 1,
      detail: 1,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    }));
    b.connect(scaledUV).to(nY, "p");
    b.connect(tY).to(nY, "t");

    // noise-texture remaps simplex to [0,1]; restore signed [-1,1] to match
    // the bespoke effect's center-of-zero displacement.
    const two = b.add(new N.Const({ value: 2 }));
    const oneV = b.add(new N.Const({ value: 1 }));
    const nX2 = b.add(new N.Math({ op: "mul" }));
    b.connect(nX).to(nX2, "a");
    b.connect(two).to(nX2, "b");
    const nXs = b.add(new N.Math({ op: "sub" }));
    b.connect(nX2).to(nXs, "a");
    b.connect(oneV).to(nXs, "b");
    const nY2 = b.add(new N.Math({ op: "mul" }));
    b.connect(nY).to(nY2, "a");
    b.connect(two).to(nY2, "b");
    const nYs = b.add(new N.Math({ op: "sub" }));
    b.connect(nY2).to(nYs, "a");
    b.connect(oneV).to(nYs, "b");

    // offset = vec2(nXs, nYs) * intensity * 0.1
    const noiseV = b.add(new N.CombineXy());
    b.connect(nXs).to(noiseV, "x");
    b.connect(nYs).to(noiseV, "y");
    const tenth = b.add(new N.Const({ value: 0.1 }));
    const amt = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.intensity).to(amt, "a");
    b.connect(tenth).to(amt, "b");
    const offsetV = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(noiseV).to(offsetV, "a");
    b.connect(amt).to(offsetV, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(finalUv, "a");
    b.connect(offsetV).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "mirror" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(FlowField);
export default FlowField;
