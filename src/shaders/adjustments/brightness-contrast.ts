// BrightnessContrast — graph-decomposed adjustment.
//
//   col = (rgb − 0.5) · (contrast + 1) + 0.5 + brightness
//
// User-facing pins (`brightness`, `contrast`) live on the graph's GroupInput,
// so the property pane shows them exactly as before. The graph body uses the
// primitives in node-graph/primitives/.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Brightness/Contrast",
  description:
    "Adjusts brightness and contrast of the rendered pixels — applied after shading.",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class BrightnessContrast extends GraphEffectBase {
  static readonly typeId = "brightness-contrast";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "brightness", type: "float", label: "Brightness", default: 0 },
      { id: "contrast", type: "float", label: "Contrast", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");

    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // mid = rgb − 0.5
    const negHalf = b.add("value", { value: -0.5 });
    const mid = b.add("color-math", { op: "addScalar" });
    b.connect(sampleColor, mid.nodeId, "a");
    b.connect(negHalf, mid.nodeId, "b");

    // gain = contrast + 1
    const one = b.add("value", { value: 1 });
    const gain = b.add("math", { op: "add" });
    b.connect(gi.contrast, gain.nodeId, "a");
    b.connect(one, gain.nodeId, "b");

    // scaled = mid * gain
    const scaled = b.add("color-math", { op: "scale" });
    b.connect(mid, scaled.nodeId, "a");
    b.connect(gain, scaled.nodeId, "b");

    // shifted = scaled + 0.5
    const half = b.add("value", { value: 0.5 });
    const shifted = b.add("color-math", { op: "addScalar" });
    b.connect(scaled, shifted.nodeId, "a");
    b.connect(half, shifted.nodeId, "b");

    // final = shifted + brightness
    const final = b.add("color-math", { op: "addScalar" });
    b.connect(shifted, final.nodeId, "a");
    b.connect(gi.brightness, final.nodeId, "b");

    return b.output(final, sampleAlpha);
  }
}

register(BrightnessContrast);
export default BrightnessContrast;
