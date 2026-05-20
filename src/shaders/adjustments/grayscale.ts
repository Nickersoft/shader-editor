// Grayscale — graph-decomposed adjustment.
//   lum = dot(rgb, [0.2126, 0.7152, 0.0722])   // Rec.709
//   result = mix(rgb, vec3(lum), amount)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Grayscale",
  description: "Convert colors to black and white",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Grayscale extends ProceduralEffect {
  static readonly typeId = "grayscale";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amount", type: "float", label: "Amount", default: 1 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    // weights = vec3(0.2126, 0.7152, 0.0722)
    const wR = b.add(new N.Const({ value: 0.2126 }));
    const wG = b.add(new N.Const({ value: 0.7152 }));
    const wB = b.add(new N.Const({ value: 0.0722 }));
    const weights = b.add(new N.CombineColor());
    b.connect(wR).to(weights, "r");
    b.connect(wG).to(weights, "g");
    b.connect(wB).to(weights, "b");

    const lum = b.add(new N.ColorMath({ op: "dot" }));
    b.connect(color).to(lum, "a");
    b.connect(weights).to(lum, "b");

    const lumVec3 = b.add(new N.CombineColor());
    b.connect(lum).to(lumVec3, "r");
    b.connect(lum).to(lumVec3, "g");
    b.connect(lum).to(lumVec3, "b");

    const result = b.add(new N.MixColor({ clampT: true }));
    b.connect(color).to(result, "a");
    b.connect(lumVec3).to(result, "b");
    b.connect(gi.amount).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Grayscale);
export default Grayscale;
