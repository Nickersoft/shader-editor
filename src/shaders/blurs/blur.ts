// Blur — graph-decomposed. The legacy effect runs two separable Gaussian
// passes (horizontal then vertical) and writes each to its own FBO. The
// node-graph form can't chain samplers because each `sampler` reads
// `u_prevPass`, not another sampler's output — so we approximate the 2D
// Gaussian as the average of an H-only and a V-only sampler. Visually
// softer than the 13-tap separable blur, but the character is preserved
// and the single-pass form fits inside `ProceduralEffect`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const h = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, h.nodeId, "uv");
    b.connect(gi.intensity, h.nodeId, "amount");
    b.connect(b.add("value", { value: 0 }), h.nodeId, "direction");

    const v = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, v.nodeId, "uv");
    b.connect(gi.intensity, v.nodeId, "amount");
    b.connect(b.add("value", { value: 90 }), v.nodeId, "direction");

    // out = (H + V) * 0.5
    const sum = b.add("color-math", { op: "add" });
    b.connect(h, sum.nodeId, "a");
    b.connect(v, sum.nodeId, "b");
    const avg = b.add("color-math", { op: "scale" });
    b.connect(sum, avg.nodeId, "a");
    b.connect(b.add("value", { value: 0.5 }), avg.nodeId, "b");

    const center = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, center.nodeId, "uv");

    return b.output(avg, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(Blur);
export default Blur;
