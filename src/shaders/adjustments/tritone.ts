// Tritone — graph-decomposed adjustment.
//   lum = luma(rgb)
//   shadowToMid = smoothstep(blend - softness, blend, lum)
//   lower = mix(colorA, colorB, shadowToMid)
//   midToHi = smoothstep(blend, blend + softness, lum)
//   upper = mix(colorB, colorC, midToHi)
//   pick = smoothstep(blend - 0.4*softness, blend + 0.4*softness, lum)
//   result = mix(lower, upper, pick)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Tritone",
  description: "Map colors to three tones: shadows, midtones, highlights",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Tritone extends ProceduralEffect {
  static readonly typeId = "tritone";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      {
        id: "colorA",
        type: "vec3",
        label: "Color A (shadows)",
        default: [0.808, 0.106, 0.918],
      },
      {
        id: "colorB",
        type: "vec3",
        label: "Color B (midtones)",
        default: [0.184, 1, 0],
      },
      {
        id: "colorC",
        type: "vec3",
        label: "Color C (highlights)",
        default: [1, 1, 0],
      },
      { id: "blendMid", type: "float", label: "Midpoint", default: 0.5 },
      { id: "softness", type: "float", label: "Softness", default: 0.25 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(color).to(lum, "a");

    // shadowToMid edges: (blend - softness, blend)
    const e0Lower = b.add(new N.Math({ op: "sub" }));
    b.connect(gi.blendMid).to(e0Lower, "a");
    b.connect(gi.softness).to(e0Lower, "b");
    const shadowToMid = b.add(new N.Smoothstep());
    b.connect(e0Lower).to(shadowToMid, "edge0");
    b.connect(gi.blendMid).to(shadowToMid, "edge1");
    b.connect(lum).to(shadowToMid, "x");
    const lower = b.add(new N.MixColor({ clampT: true }));
    b.connect(gi.colorA).to(lower, "a");
    b.connect(gi.colorB).to(lower, "b");
    b.connect(shadowToMid).to(lower, "t");

    // midToHi edges: (blend, blend + softness)
    const e1Upper = b.add(new N.Math({ op: "add" }));
    b.connect(gi.blendMid).to(e1Upper, "a");
    b.connect(gi.softness).to(e1Upper, "b");
    const midToHi = b.add(new N.Smoothstep());
    b.connect(gi.blendMid).to(midToHi, "edge0");
    b.connect(e1Upper).to(midToHi, "edge1");
    b.connect(lum).to(midToHi, "x");
    const upper = b.add(new N.MixColor({ clampT: true }));
    b.connect(gi.colorB).to(upper, "a");
    b.connect(gi.colorC).to(upper, "b");
    b.connect(midToHi).to(upper, "t");

    // pick edges: (blend - 0.4*softness, blend + 0.4*softness)
    const narrow = b.add(new N.Const({ value: 0.4 }));
    const narrowed = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.softness).to(narrowed, "a");
    b.connect(narrow).to(narrowed, "b");
    const pickE0 = b.add(new N.Math({ op: "sub" }));
    b.connect(gi.blendMid).to(pickE0, "a");
    b.connect(narrowed).to(pickE0, "b");
    const pickE1 = b.add(new N.Math({ op: "add" }));
    b.connect(gi.blendMid).to(pickE1, "a");
    b.connect(narrowed).to(pickE1, "b");
    const pick = b.add(new N.Smoothstep());
    b.connect(pickE0).to(pick, "edge0");
    b.connect(pickE1).to(pick, "edge1");
    b.connect(lum).to(pick, "x");

    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(lower).to(result, "a");
    b.connect(upper).to(result, "b");
    b.connect(pick).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Tritone);
export default Tritone;
