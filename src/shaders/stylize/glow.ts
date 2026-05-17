// Glow — graph-decomposed. The legacy effect builds a "bright pass" (RGB −
// threshold, gated by luminance smoothstep) then sums a 7×7 box blur of it
// across the previous-pass texture. In the graph form we approximate with
// a single cross-blur of the previous pass, take its bright contribution
// (sample − threshold, smoothstepped), and add tinted glow back into the
// original.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Glow",
  description: "True bloom — bright pass + blur + add",
  color: "#fbbf24",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Glow extends ProceduralEffect {
  static readonly typeId = "glow";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "threshold", type: "float", label: "Threshold", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.05 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
      { id: "tint", type: "vec3", label: "Tint", default: [1, 1, 1] },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // Cross-blur the previous pass.
    const h = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, h.nodeId, "uv");
    b.connect(gi.radius, h.nodeId, "amount");
    b.connect(b.add("value", { value: 0 }), h.nodeId, "direction");
    const v = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, v.nodeId, "uv");
    b.connect(gi.radius, v.nodeId, "amount");
    b.connect(b.add("value", { value: 90 }), v.nodeId, "direction");
    const sum = b.add("color-math", { op: "add" });
    b.connect(h, sum.nodeId, "a");
    b.connect(v, sum.nodeId, "b");
    const blurred = b.add("color-math", { op: "scale" });
    b.connect(sum, blurred.nodeId, "a");
    b.connect(b.add("value", { value: 0.5 }), blurred.nodeId, "b");

    // bright = max(blurred − threshold, 0) — approximated by addScalar(−thr).
    const negThr = b.add("math", { op: "neg" });
    b.connect(gi.threshold, negThr.nodeId, "x");
    const shifted = b.add("color-math", { op: "addScalar" });
    b.connect(blurred, shifted.nodeId, "a");
    b.connect(negThr, shifted.nodeId, "b");
    const bright = b.add("color-math", { op: "max" });
    b.connect(shifted, bright.nodeId, "a");
    // float → vec3 broadcast via coerce produces vec3(0).
    b.connect(b.add("value", { value: 0 }), bright.nodeId, "b");

    // tinted = bright · tint · intensity
    const tinted = b.add("color-math", { op: "mul" });
    b.connect(bright, tinted.nodeId, "a");
    b.connect(gi.tint, tinted.nodeId, "b");
    const tintedI = b.add("color-math", { op: "scale" });
    b.connect(tinted, tintedI.nodeId, "a");
    b.connect(gi.intensity, tintedI.nodeId, "b");

    // out = src + tinted
    const src = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, src.nodeId, "uv");
    const out = b.add("color-math", { op: "add" });
    b.connect({ nodeId: src.nodeId, pin: "color" }, out.nodeId, "a");
    b.connect(tintedI, out.nodeId, "b");

    return b.output(out, { nodeId: src.nodeId, pin: "alpha" });
  }
}

register(Glow);
export default Glow;
