// Invert — graph-decomposed adjustment.
//   result = mix(rgb, 1 - rgb, amount)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const inverted = b.add(new N.ColorMath({ op: "oneminus" }));
    b.connect(color).to(inverted, "a");

    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(color).to(result, "a");
    b.connect(inverted).to(result, "b");
    b.connect(gi.amount).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Invert);
export default Invert;
