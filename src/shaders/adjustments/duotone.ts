// Duotone — graph-decomposed adjustment.
//   lum = luma(rgb)
//   t = smoothstep(blend - 0.5, blend + 0.5, lum)
//   result = mix(colorA, colorB, t)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Duotone",
  description: "Map colors to two tones based on luminance",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Duotone extends ProceduralEffect {
  static readonly typeId = "duotone";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "colorA", type: "vec3", label: "Color A (shadows)", default: [1, 0, 0] },
      {
        id: "colorB",
        type: "vec3",
        label: "Color B (highlights)",
        default: [0.008, 0.227, 0.957],
      },
      { id: "blend", type: "float", label: "Blend", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(color).to(lum, "a");

    const half = b.add(new N.Const({ value: 0.5 }));
    const e0 = b.add(new N.Math({ op: "sub" }));
    b.connect(gi.blend).to(e0, "a");
    b.connect(half).to(e0, "b");
    const e1 = b.add(new N.Math({ op: "add" }));
    b.connect(gi.blend).to(e1, "a");
    b.connect(half).to(e1, "b");

    const t = b.add(new N.Smoothstep());
    b.connect(e0).to(t, "edge0");
    b.connect(e1).to(t, "edge1");
    b.connect(lum).to(t, "x");

    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(gi.colorA).to(result, "a");
    b.connect(gi.colorB).to(result, "b");
    b.connect(t).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Duotone);
export default Duotone;
