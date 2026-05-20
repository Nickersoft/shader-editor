// Sharpness — graph-decomposed adjustment built on the `sampler` primitive in
// `kernel-3x3` mode. The Laplacian-style sharpen kernel is parameterised by
// `amount`: centre weight `(1 + 4·amount)`, neighbours `−amount`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Sharpness",
  description: "Adjust image sharpness using a convolution kernel",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Sharpness extends ProceduralEffect {
  static readonly typeId = "sharpness";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Sharpness", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // Kernel weights are static — the sampler bakes them into emit time.
    // Default tuple `[0,-1,0,-1,5,-1,0,-1,0]` mirrors the legacy expression
    // when amount=1; pin-wired amount applies via post-scale below.
    const sample = b.add(new N.Sampler({ mode: "kernel-3x3", edges: "stretch", kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0] }), );
    b.connect(uv).to(sample, "uv");

    // The sampler emits 5·rgb − 4·rgb_neighbours. The original effect
    // interpolates between identity and that delta by `amount`. Equivalent:
    //   out = mix(centerSample, sharpened, amount)
    // Centre tap as a separate sample-previous-pass for the mix base.
    const center = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(center, "uv");

    const mixed = b.add(new N.MixColor());
    b.connect(center, "color").to(mixed, "a");
    b.connect(sample).to(mixed, "b");
    b.connect(gi.amount).to(mixed, "t");

    return b.output(mixed, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(Sharpness);
export default Sharpness;
