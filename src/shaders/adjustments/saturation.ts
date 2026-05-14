// Saturation — graph-decomposed adjustment.
//   lum = dot(rgb, [0.2126, 0.7152, 0.0722])   // Rec.709
//   result = mix(vec3(lum), rgb, intensity)    // unclamped — intensity > 1 oversaturates

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Saturation",
  description: "Adjust color saturation intensity",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Saturation extends GraphEffectBase {
  static readonly typeId = "saturation";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const wR = b.add("value", { value: 0.2126 });
    const wG = b.add("value", { value: 0.7152 });
    const wB = b.add("value", { value: 0.0722 });
    const weights = b.add("combine-color", {});
    b.connect(wR, weights.nodeId, "r");
    b.connect(wG, weights.nodeId, "g");
    b.connect(wB, weights.nodeId, "b");

    const lum = b.add("color-math", { op: "dot" });
    b.connect(color, lum.nodeId, "a");
    b.connect(weights, lum.nodeId, "b");

    const lumVec3 = b.add("combine-color", {});
    b.connect(lum, lumVec3.nodeId, "r");
    b.connect(lum, lumVec3.nodeId, "g");
    b.connect(lum, lumVec3.nodeId, "b");

    const result = b.add("mix-color", { clampT: false });
    b.connect(lumVec3, result.nodeId, "a");
    b.connect(color, result.nodeId, "b");
    b.connect(gi.intensity, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Saturation);
export default Saturation;
