// HueShift — graph-decomposed adjustment.
//   hsv = rgb2hsv(rgb)
//   hsv.x = fract(hsv.x + shift / 360)
//   result = hsv2rgb(hsv)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Hue Shift",
  description: "Rotate hue around the color wheel",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class HueShift extends ProceduralEffect {
  static readonly typeId = "hue-shift";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "shift", type: "float", label: "Shift", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const hsv = b.add("rgb-to-hsv", {}, undefined, "hsv");
    b.connect(color, hsv.nodeId, "rgb");

    const split = b.add("separate-color", {});
    b.connect(hsv, split.nodeId, "v");

    // Normalise shift (deg) into hue space [0,1] and wrap with fract.
    const deg = b.add("value", { value: 1 / 360 });
    const factor = b.add("math", { op: "mul" });
    b.connect(gi.shift, factor.nodeId, "a");
    b.connect(deg, factor.nodeId, "b");

    const sumH = b.add("math", { op: "add" });
    b.connect({ nodeId: split.nodeId, pin: "r" }, sumH.nodeId, "a");
    b.connect(factor, sumH.nodeId, "b");

    const wrapH = b.add("math", { op: "fract" });
    b.connect(sumH, wrapH.nodeId, "x");

    const newHsv = b.add("combine-color", {});
    b.connect(wrapH, newHsv.nodeId, "r");
    b.connect({ nodeId: split.nodeId, pin: "g" }, newHsv.nodeId, "g");
    b.connect({ nodeId: split.nodeId, pin: "b" }, newHsv.nodeId, "b");

    const result = b.add("hsv-to-rgb", {}, undefined, "rgb");
    b.connect(newHsv, result.nodeId, "hsv");

    return b.output(result, alpha);
  }
}

register(HueShift);
export default HueShift;
