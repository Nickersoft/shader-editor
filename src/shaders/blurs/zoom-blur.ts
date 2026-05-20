// ZoomBlur — graph-decomposed. The `sampler` primitive's zoom mode samples N
// times between `center` and `uv`, averaging the taps. `amount` controls how
// far each tap is pulled toward the centre.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const center = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(center, "x");
    b.connect(gi.centerY).to(center, "y");

    const sampler = b.add(new N.Sampler({ mode: "zoom", samples: 32, edges: "stretch" }), );
    b.connect(uv).to(sampler, "uv");
    b.connect(gi.intensity).to(sampler, "amount");
    b.connect(center).to(sampler, "center");

    const passthrough = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(passthrough, "uv");

    return b.output(sampler, { nodeId: passthrough.nodeId, pin: "alpha" });
  }
}

register(ZoomBlur);
export default ZoomBlur;
