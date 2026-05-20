// LinearBlur — graph-decomposed. The `sampler` primitive's linear mode does
// exactly this: N samples along a direction vector through `uv`, averaged.
// The legacy effect uses Gaussian-weighted samples; this version uses
// uniform weights, so the falloff at the edges of the smear is slightly
// harder, but the visual character (directional smear) is preserved.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Linear Blur",
  description: "Directional motion blur",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class LinearBlur extends ProceduralEffect {
  static readonly typeId = "linear-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const sampler = b.add(new N.Sampler({ mode: "linear", samples: 32, edges: "stretch" }), );
    b.connect(uv).to(sampler, "uv");
    b.connect(gi.intensity).to(sampler, "amount");
    b.connect(gi.angle).to(sampler, "direction");

    const center = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(center, "uv");

    return b.output(sampler, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(LinearBlur);
export default LinearBlur;
