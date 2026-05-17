// Tritone — graph-decomposed adjustment.
//   lum = luma(rgb)
//   shadowToMid = smoothstep(blend - softness, blend, lum)
//   lower = mix(colorA, colorB, shadowToMid)
//   midToHi = smoothstep(blend, blend + softness, lum)
//   upper = mix(colorB, colorC, midToHi)
//   pick = smoothstep(blend - 0.4*softness, blend + 0.4*softness, lum)
//   result = mix(lower, upper, pick)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add("color-math", { op: "luminance" });
    b.connect(color, lum.nodeId, "a");

    // shadowToMid edges: (blend - softness, blend)
    const e0Lower = b.add("math", { op: "sub" });
    b.connect(gi.blendMid, e0Lower.nodeId, "a");
    b.connect(gi.softness, e0Lower.nodeId, "b");
    const shadowToMid = b.add("smoothstep", {});
    b.connect(e0Lower, shadowToMid.nodeId, "edge0");
    b.connect(gi.blendMid, shadowToMid.nodeId, "edge1");
    b.connect(lum, shadowToMid.nodeId, "x");
    const lower = b.add("mix-color", { clampT: true });
    b.connect(gi.colorA, lower.nodeId, "a");
    b.connect(gi.colorB, lower.nodeId, "b");
    b.connect(shadowToMid, lower.nodeId, "t");

    // midToHi edges: (blend, blend + softness)
    const e1Upper = b.add("math", { op: "add" });
    b.connect(gi.blendMid, e1Upper.nodeId, "a");
    b.connect(gi.softness, e1Upper.nodeId, "b");
    const midToHi = b.add("smoothstep", {});
    b.connect(gi.blendMid, midToHi.nodeId, "edge0");
    b.connect(e1Upper, midToHi.nodeId, "edge1");
    b.connect(lum, midToHi.nodeId, "x");
    const upper = b.add("mix-color", { clampT: true });
    b.connect(gi.colorB, upper.nodeId, "a");
    b.connect(gi.colorC, upper.nodeId, "b");
    b.connect(midToHi, upper.nodeId, "t");

    // pick edges: (blend - 0.4*softness, blend + 0.4*softness)
    const narrow = b.add("value", { value: 0.4 });
    const narrowed = b.add("math", { op: "mul" });
    b.connect(gi.softness, narrowed.nodeId, "a");
    b.connect(narrow, narrowed.nodeId, "b");
    const pickE0 = b.add("math", { op: "sub" });
    b.connect(gi.blendMid, pickE0.nodeId, "a");
    b.connect(narrowed, pickE0.nodeId, "b");
    const pickE1 = b.add("math", { op: "add" });
    b.connect(gi.blendMid, pickE1.nodeId, "a");
    b.connect(narrowed, pickE1.nodeId, "b");
    const pick = b.add("smoothstep", {});
    b.connect(pickE0, pick.nodeId, "edge0");
    b.connect(pickE1, pick.nodeId, "edge1");
    b.connect(lum, pick.nodeId, "x");

    const result = b.add("mix-color", { clampT: true });
    b.connect(lower, result.nodeId, "a");
    b.connect(upper, result.nodeId, "b");
    b.connect(pick, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Tritone);
export default Tritone;
