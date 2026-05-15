// LinearBlur — graph-decomposed. The `sampler` primitive's linear mode does
// exactly this: N samples along a direction vector through `uv`, averaged.
// The legacy effect uses Gaussian-weighted samples; this version uses
// uniform weights, so the falloff at the edges of the smear is slightly
// harder, but the visual character (directional smear) is preserved.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Linear Blur",
  description: "Directional motion blur",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class LinearBlur extends GraphEffectBase {
  static readonly typeId = "linear-blur";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const sampler = b.add(
      "sampler",
      { mode: "linear", samples: 32, edges: "stretch" },
    );
    b.connect(uv, sampler.nodeId, "uv");
    b.connect(gi.intensity, sampler.nodeId, "amount");
    b.connect(gi.angle, sampler.nodeId, "direction");

    const center = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, center.nodeId, "uv");

    return b.output(sampler, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(LinearBlur);
export default LinearBlur;
