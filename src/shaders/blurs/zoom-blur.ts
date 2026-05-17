// ZoomBlur — graph-decomposed. The `sampler` primitive's zoom mode samples N
// times between `center` and `uv`, averaging the taps. `amount` controls how
// far each tap is pulled toward the centre.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Zoom Blur",
  description: "Radial zoom blur from a focal point",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class ZoomBlur extends ProceduralEffect {
  static readonly typeId = "zoom-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const center = b.add("combine-xy", {});
    b.connect(gi.centerX, center.nodeId, "x");
    b.connect(gi.centerY, center.nodeId, "y");

    const sampler = b.add(
      "sampler",
      { mode: "zoom", samples: 32, edges: "stretch" },
    );
    b.connect(uv, sampler.nodeId, "uv");
    b.connect(gi.intensity, sampler.nodeId, "amount");
    b.connect(center, sampler.nodeId, "center");

    const passthrough = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, passthrough.nodeId, "uv");

    return b.output(sampler, { nodeId: passthrough.nodeId, pin: "alpha" });
  }
}

register(ZoomBlur);
export default ZoomBlur;
