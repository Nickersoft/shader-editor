// Glow — graph-decomposed. The legacy effect builds a "bright pass" (RGB −
// threshold, gated by luminance smoothstep) then sums a 7×7 box blur of it
// across the previous-pass texture. In the graph form we approximate with
// a single cross-blur of the previous pass, take its bright contribution
// (sample − threshold, smoothstepped), and add tinted glow back into the
// original.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // Cross-blur the previous pass.
    const h = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(h, "uv");
    b.connect(gi.radius).to(h, "amount");
    b.connect(b.add(new N.Const({ value: 0 }))).to(h, "direction");
    const v = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(v, "uv");
    b.connect(gi.radius).to(v, "amount");
    b.connect(b.add(new N.Const({ value: 90 }))).to(v, "direction");
    const sum = b.add(new N.ColorMath({ op: "add" }));
    b.connect(h).to(sum, "a");
    b.connect(v).to(sum, "b");
    const blurred = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sum).to(blurred, "a");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(blurred, "b");

    // bright = max(blurred − threshold, 0) — approximated by addScalar(−thr).
    const negThr = b.add(new N.Math({ op: "neg" }));
    b.connect(gi.threshold).to(negThr, "x");
    const shifted = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(blurred).to(shifted, "a");
    b.connect(negThr).to(shifted, "b");
    const bright = b.add(new N.ColorMath({ op: "max" }));
    b.connect(shifted).to(bright, "a");
    // float → vec3 broadcast via coerce produces vec3(0).
    b.connect(b.add(new N.Const({ value: 0 }))).to(bright, "b");

    // tinted = bright · tint · intensity
    const tinted = b.add(new N.ColorMath({ op: "mul" }));
    b.connect(bright).to(tinted, "a");
    b.connect(gi.tint).to(tinted, "b");
    const tintedI = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(tinted).to(tintedI, "a");
    b.connect(gi.intensity).to(tintedI, "b");

    // out = src + tinted
    const src = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(src, "uv");
    const out = b.add(new N.ColorMath({ op: "add" }));
    b.connect(src, "color").to(out, "a");
    b.connect(tintedI).to(out, "b");

    return b.output(out, { nodeId: src.nodeId, pin: "alpha" });
  }
}

register(Glow);
export default Glow;
