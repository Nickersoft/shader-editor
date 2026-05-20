// AngularBlur — graph-decomposed. The `sampler` primitive's angular mode
// rotates `uv` around `center` by ±amount radians across N taps. The legacy
// effect uses Gaussian-weighted samples and an aspect-ratio correction; this
// version uses uniform weights in UV space — the smear character is
// preserved but the falloff at the arc ends is sharper.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Angular Blur",
  description: "Circular blur around a focal point",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class AngularBlur extends ProceduralEffect {
  static readonly typeId = "angular-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const center = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(center, "x");
    b.connect(gi.centerY).to(center, "y");

    // The legacy effect interprets `intensity` as half an arc in [0, π]
    // (arc = intensity·π, sampled in ±half-arc steps). The sampler's
    // angular mode treats `amount` directly as ± radians, so we pre-scale
    // intensity by π to keep the visual scale similar.
    const amount = b.add(new N.Math({ op: "mul" }), { b: Math.PI });
    b.connect(gi.intensity).to(amount, "a");

    const sampler = b.add(new N.Sampler({ mode: "angular", samples: 32, edges: "stretch" }), );
    b.connect(uv).to(sampler, "uv");
    b.connect(amount).to(sampler, "amount");
    b.connect(center).to(sampler, "center");

    const passthrough = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(passthrough, "uv");

    return b.output(sampler, { nodeId: passthrough.nodeId, pin: "alpha" });
  }
}

register(AngularBlur);
export default AngularBlur;
