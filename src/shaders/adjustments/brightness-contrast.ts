// BrightnessContrast — graph-decomposed adjustment.
//
//   col = (rgb − 0.5) · (contrast + 1) + 0.5 + brightness
//
// User-facing pins (`brightness`, `contrast`) live on the graph's GroupInput,
// so the property pane shows them exactly as before. The graph body uses the
// primitives in node-graph/nodes/.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Brightness/Contrast",
  description:
    "Adjusts brightness and contrast of the rendered pixels — applied after shading.",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class BrightnessContrast extends ProceduralEffect {
  static readonly typeId = "brightness-contrast";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "brightness", type: "float", label: "Brightness", default: 0 },
      { id: "contrast", type: "float", label: "Contrast", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");

    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // mid = rgb − 0.5
    const negHalf = b.add(new N.Const({ value: -0.5 }));
    const mid = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(sampleColor).to(mid, "a");
    b.connect(negHalf).to(mid, "b");

    // gain = contrast + 1
    const one = b.add(new N.Const({ value: 1 }));
    const gain = b.add(new N.Math({ op: "add" }));
    b.connect(gi.contrast).to(gain, "a");
    b.connect(one).to(gain, "b");

    // scaled = mid * gain
    const scaled = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(mid).to(scaled, "a");
    b.connect(gain).to(scaled, "b");

    // shifted = scaled + 0.5
    const half = b.add(new N.Const({ value: 0.5 }));
    const shifted = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(scaled).to(shifted, "a");
    b.connect(half).to(shifted, "b");

    // final = shifted + brightness
    const final = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(shifted).to(final, "a");
    b.connect(gi.brightness).to(final, "b");

    return b.output(final, sampleAlpha);
  }
}

register(BrightnessContrast);
export default BrightnessContrast;
