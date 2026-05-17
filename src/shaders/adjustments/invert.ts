// Invert — graph-decomposed adjustment.
//   result = mix(rgb, 1 - rgb, amount)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Invert",
  description: "Color inversion",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Invert extends ProceduralEffect {
  static readonly typeId = "invert";
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

    const inverted = b.add("color-math", { op: "oneminus" });
    b.connect(color, inverted.nodeId, "a");

    const result = b.add("mix-color", { clampT: true });
    b.connect(color, result.nodeId, "a");
    b.connect(inverted, result.nodeId, "b");
    b.connect(gi.amount, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Invert);
export default Invert;
