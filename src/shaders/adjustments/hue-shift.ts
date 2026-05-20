// HueShift — graph-decomposed adjustment.
//   hsv = rgb2hsv(rgb)
//   hsv.x = fract(hsv.x + shift / 360)
//   result = hsv2rgb(hsv)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const hsv = b.add(new N.RgbToHsv(), undefined, "hsv");
    b.connect(color).to(hsv, "rgb");

    const split = b.add(new N.SeparateColor());
    b.connect(hsv).to(split, "v");

    // Normalise shift (deg) into hue space [0,1] and wrap with fract.
    const deg = b.add(new N.Const({ value: 1 / 360 }));
    const factor = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.shift).to(factor, "a");
    b.connect(deg).to(factor, "b");

    const sumH = b.add(new N.Math({ op: "add" }));
    b.connect(split, "r").to(sumH, "a");
    b.connect(factor).to(sumH, "b");

    const wrapH = b.add(new N.Math({ op: "fract" }));
    b.connect(sumH).to(wrapH, "x");

    const newHsv = b.add(new N.CombineColor());
    b.connect(wrapH).to(newHsv, "r");
    b.connect(split, "g").to(newHsv, "g");
    b.connect(split, "b").to(newHsv, "b");

    const result = b.add(new N.HsvToRgb(), undefined, "rgb");
    b.connect(newHsv).to(result, "hsv");

    return b.output(result, alpha);
  }
}

register(HueShift);
export default HueShift;
