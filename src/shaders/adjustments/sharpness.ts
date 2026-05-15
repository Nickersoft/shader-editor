// Sharpness — graph-decomposed adjustment built on the `sampler` primitive in
// `kernel-3x3` mode. The Laplacian-style sharpen kernel is parameterised by
// `amount`: centre weight `(1 + 4·amount)`, neighbours `−amount`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Sharpness",
  description: "Adjust image sharpness using a convolution kernel",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Sharpness extends GraphEffectBase {
  static readonly typeId = "sharpness";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Sharpness", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // Kernel weights are static — the sampler bakes them into emit time.
    // Default tuple `[0,-1,0,-1,5,-1,0,-1,0]` mirrors the legacy expression
    // when amount=1; pin-wired amount applies via post-scale below.
    const sample = b.add(
      "sampler",
      { mode: "kernel-3x3", edges: "stretch", kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
    );
    b.connect(uv, sample.nodeId, "uv");

    // The sampler emits 5·rgb − 4·rgb_neighbours. The original effect
    // interpolates between identity and that delta by `amount`. Equivalent:
    //   out = mix(centerSample, sharpened, amount)
    // Centre tap as a separate sample-previous-pass for the mix base.
    const center = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, center.nodeId, "uv");

    const mixed = b.add("mix-color", {});
    b.connect({ nodeId: center.nodeId, pin: "color" }, mixed.nodeId, "a");
    b.connect(sample, mixed.nodeId, "b");
    b.connect(gi.amount, mixed.nodeId, "t");

    return b.output(mixed, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(Sharpness);
export default Sharpness;
