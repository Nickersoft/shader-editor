// Blur — graph-decomposed. The legacy effect runs two separable Gaussian
// passes (horizontal then vertical) and writes each to its own FBO. The
// node-graph form can't chain samplers because each `sampler` reads
// `u_prevPass`, not another sampler's output — so we approximate the 2D
// Gaussian as the average of an H-only and a V-only sampler. Visually
// softer than the 13-tap separable blur, but the character is preserved
// and the single-pass form fits inside `ProceduralEffect`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Blur",
  description: "Symmetric Gaussian blur",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class Blur extends ProceduralEffect {
  static readonly typeId = "blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.25 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const h = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(h, "uv");
    b.connect(gi.intensity).to(h, "amount");
    b.connect(b.add(new N.Const({ value: 0 }))).to(h, "direction");

    const v = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(v, "uv");
    b.connect(gi.intensity).to(v, "amount");
    b.connect(b.add(new N.Const({ value: 90 }))).to(v, "direction");

    // out = (H + V) * 0.5
    const sum = b.add(new N.ColorMath({ op: "add" }));
    b.connect(h).to(sum, "a");
    b.connect(v).to(sum, "b");
    const avg = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sum).to(avg, "a");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(avg, "b");

    const center = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(center, "uv");

    return b.output(avg, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(Blur);
export default Blur;
