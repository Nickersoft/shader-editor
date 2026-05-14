// Tint — graph-decomposed adjustment.
//   tinted = mix(rgb, tintColor, amount)
//   adjusted = tinted * (luma(rgb) / max(luma(tinted), 1e-4))
//   result = mix(tinted, adjusted, preserveLuminosity ? 1 : 0)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Tint",
  description: "Apply a color tint to the image",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Tint extends GraphEffectBase {
  static readonly typeId = "tint";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const tinted = b.add("mix-color", { clampT: true });
    b.connect(color, tinted.nodeId, "a");
    b.connect(gi.color, tinted.nodeId, "b");
    b.connect(gi.amount, tinted.nodeId, "t");

    const origLum = b.add("color-math", { op: "luminance" });
    b.connect(color, origLum.nodeId, "a");
    const tintedLum = b.add("color-math", { op: "luminance" });
    b.connect(tinted, tintedLum.nodeId, "a");

    const eps = b.add("value", { value: 1e-4 });
    const safeLum = b.add("math", { op: "max" });
    b.connect(tintedLum, safeLum.nodeId, "a");
    b.connect(eps, safeLum.nodeId, "b");

    const ratio = b.add("math", { op: "div" });
    b.connect(origLum, ratio.nodeId, "a");
    b.connect(safeLum, ratio.nodeId, "b");

    const adjusted = b.add("color-math", { op: "scale" });
    b.connect(tinted, adjusted.nodeId, "a");
    b.connect(ratio, adjusted.nodeId, "b");

    // The bool→float conversion happens implicitly at mix-color's `t`
    // input via the coercion layer — no explicit converter needed.
    const result = b.add("mix-color", { clampT: true });
    b.connect(tinted, result.nodeId, "a");
    b.connect(adjusted, result.nodeId, "b");
    b.connect(gi.preserveLuminosity, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Tint);
export default Tint;
