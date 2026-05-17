// Grayscale — graph-decomposed adjustment.
//   lum = dot(rgb, [0.2126, 0.7152, 0.0722])   // Rec.709
//   result = mix(rgb, vec3(lum), amount)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Grayscale",
  description: "Convert colors to black and white",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Grayscale extends ProceduralEffect {
  static readonly typeId = "grayscale";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Amount", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    // weights = vec3(0.2126, 0.7152, 0.0722)
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

    const result = b.add("mix-color", { clampT: true });
    b.connect(color, result.nodeId, "a");
    b.connect(lumVec3, result.nodeId, "b");
    b.connect(gi.amount, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Grayscale);
export default Grayscale;
