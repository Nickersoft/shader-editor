// Solarize — graph-decomposed adjustment.
//   lum = luma(rgb)
//   mask = step(threshold, lum)
//   solarized = mix(rgb, 1 - rgb, mask)
//   result = mix(rgb, solarized, strength)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(color).to(lum, "a");

    const mask = b.add(new N.Math({ op: "step" }));
    b.connect(gi.threshold).to(mask, "a");
    b.connect(lum).to(mask, "b");

    const inverted = b.add(new N.ColorMath({ op: "oneminus" }));
    b.connect(color).to(inverted, "a");

    const solarized = b.add(new N.MixColor({ clampT: true }));
    b.connect(color).to(solarized, "a");
    b.connect(inverted).to(solarized, "b");
    b.connect(mask).to(solarized, "t");

    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(color).to(result, "a");
    b.connect(solarized).to(result, "b");
    b.connect(gi.strength).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Solarize);
export default Solarize;
