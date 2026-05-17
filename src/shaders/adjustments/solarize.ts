// Solarize — graph-decomposed adjustment.
//   lum = luma(rgb)
//   mask = step(threshold, lum)
//   solarized = mix(rgb, 1 - rgb, mask)
//   result = mix(rgb, solarized, strength)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Solarize",
  description: "Inverts tones above a luminance threshold",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Solarize extends ProceduralEffect {
  static readonly typeId = "solarize";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "threshold", type: "float", label: "Threshold", default: 0.5 },
      { id: "strength", type: "float", label: "Strength", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add("color-math", { op: "luminance" });
    b.connect(color, lum.nodeId, "a");

    const mask = b.add("math", { op: "step" });
    b.connect(gi.threshold, mask.nodeId, "a");
    b.connect(lum, mask.nodeId, "b");

    const inverted = b.add("color-math", { op: "oneminus" });
    b.connect(color, inverted.nodeId, "a");

    const solarized = b.add("mix-color", { clampT: true });
    b.connect(color, solarized.nodeId, "a");
    b.connect(inverted, solarized.nodeId, "b");
    b.connect(mask, solarized.nodeId, "t");

    const result = b.add("mix-color", { clampT: true });
    b.connect(color, result.nodeId, "a");
    b.connect(solarized, result.nodeId, "b");
    b.connect(gi.strength, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Solarize);
export default Solarize;
