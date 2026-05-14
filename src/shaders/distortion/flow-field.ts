// FlowField — graph-decomposed distortion.
//   offset = vec2(simplex(uv·5·detail + t), simplex(uv·5·detail + 7.3 + t)) · intensity · 0.1
//   finalUV = uv + offset
//
// The two simplex samples use the noise-texture primitive in `simplex` mode;
// the offset y-channel adds 7.3 to its sample point to de-correlate the two
// channels (matching the bespoke effect's hand-tuned offset).

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Flow Field",
  description: "Fluid-like distortion with constant smooth motion",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class FlowField extends GraphEffectBase {
  static readonly typeId = "flow-field";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "detail", type: "float", label: "Detail", default: 1 },
      { id: "evolutionSpeed", type: "float", label: "Evolution Speed", default: 0.3 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.time();

    // animT = t · evolutionSpeed
    const animT = b.add("math", { op: "mul" });
    b.connect(t, animT.nodeId, "a");
    b.connect(gi.evolutionSpeed, animT.nodeId, "b");

    // scaledUV = uv · 5 · detail
    const five = b.add("value", { value: 5 });
    const scale = b.add("math", { op: "mul" });
    b.connect(five, scale.nodeId, "a");
    b.connect(gi.detail, scale.nodeId, "b");
    const scaledUV = b.add("vector-math", { op: "scale" });
    b.connect(uv, scaledUV.nodeId, "a");
    b.connect(scale, scaledUV.nodeId, "b");

    // simplex sample x: uses noise-texture primitive with p = scaledUV, t = animT.
    const nX = b.add("noise-texture", {
      kind: "simplex",
      scale: 1,
      detail: 1,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    });
    b.connect(scaledUV, nX.nodeId, "p");
    b.connect(animT, nX.nodeId, "t");

    // simplex sample y: same uv but t-input offset by 7.3 to de-correlate.
    const off = b.add("value", { value: 7.3 });
    const tY = b.add("math", { op: "add" });
    b.connect(animT, tY.nodeId, "a");
    b.connect(off, tY.nodeId, "b");
    const nY = b.add("noise-texture", {
      kind: "simplex",
      scale: 1,
      detail: 1,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    });
    b.connect(scaledUV, nY.nodeId, "p");
    b.connect(tY, nY.nodeId, "t");

    // noise-texture remaps simplex to [0,1]; restore signed [-1,1] to match
    // the bespoke effect's center-of-zero displacement.
    const two = b.add("value", { value: 2 });
    const oneV = b.add("value", { value: 1 });
    const nX2 = b.add("math", { op: "mul" });
    b.connect(nX, nX2.nodeId, "a");
    b.connect(two, nX2.nodeId, "b");
    const nXs = b.add("math", { op: "sub" });
    b.connect(nX2, nXs.nodeId, "a");
    b.connect(oneV, nXs.nodeId, "b");
    const nY2 = b.add("math", { op: "mul" });
    b.connect(nY, nY2.nodeId, "a");
    b.connect(two, nY2.nodeId, "b");
    const nYs = b.add("math", { op: "sub" });
    b.connect(nY2, nYs.nodeId, "a");
    b.connect(oneV, nYs.nodeId, "b");

    // offset = vec2(nXs, nYs) * intensity * 0.1
    const noiseV = b.add("combine-xy", {});
    b.connect(nXs, noiseV.nodeId, "x");
    b.connect(nYs, noiseV.nodeId, "y");
    const tenth = b.add("value", { value: 0.1 });
    const amt = b.add("math", { op: "mul" });
    b.connect(gi.intensity, amt.nodeId, "a");
    b.connect(tenth, amt.nodeId, "b");
    const offsetV = b.add("vector-math", { op: "scale" });
    b.connect(noiseV, offsetV.nodeId, "a");
    b.connect(amt, offsetV.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(uv, finalUv.nodeId, "a");
    b.connect(offsetV, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "mirror" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(FlowField);
export default FlowField;
