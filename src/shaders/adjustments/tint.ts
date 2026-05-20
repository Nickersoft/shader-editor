// Tint — graph-decomposed adjustment.
//   tinted = mix(rgb, tintColor, amount)
//   adjusted = tinted * (luma(rgb) / max(luma(tinted), 1e-4))
//   result = mix(tinted, adjusted, preserveLuminosity ? 1 : 0)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Tint",
  description: "Apply a color tint to the image",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Tint extends ProceduralEffect {
  static readonly typeId = "tint";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "color", type: "vec3", label: "Tint Color", default: [0.5, 0.5, 0.8] },
      { id: "amount", type: "float", label: "Amount", default: 0.5 },
      {
        id: "preserveLuminosity",
        type: "bool",
        label: "Preserve Luminosity",
        default: false,
      },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const tinted = b.add(new N.MixColor({ clampT: true }));
    b.connect(color).to(tinted, "a");
    b.connect(gi.color).to(tinted, "b");
    b.connect(gi.amount).to(tinted, "t");

    const origLum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(color).to(origLum, "a");
    const tintedLum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(tinted).to(tintedLum, "a");

    const eps = b.add(new N.Const({ value: 1e-4 }));
    const safeLum = b.add(new N.Math({ op: "max" }));
    b.connect(tintedLum).to(safeLum, "a");
    b.connect(eps).to(safeLum, "b");

    const ratio = b.add(new N.Math({ op: "div" }));
    b.connect(origLum).to(ratio, "a");
    b.connect(safeLum).to(ratio, "b");

    const adjusted = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(tinted).to(adjusted, "a");
    b.connect(ratio).to(adjusted, "b");

    // The bool→float conversion happens implicitly at mix-color's `t`
    // input via the coercion layer — no explicit converter needed.
    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(tinted).to(result, "a");
    b.connect(adjusted).to(result, "b");
    b.connect(gi.preserveLuminosity).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Tint);
export default Tint;
