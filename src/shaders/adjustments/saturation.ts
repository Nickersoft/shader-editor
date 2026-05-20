// Saturation — graph-decomposed adjustment.
//   lum = dot(rgb, [0.2126, 0.7152, 0.0722])   // Rec.709
//   result = mix(vec3(lum), rgb, intensity)    // unclamped — intensity > 1 oversaturates

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Saturation",
  description: "Adjust color saturation intensity",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Saturation extends ProceduralEffect {
  static readonly typeId = "saturation";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

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

    const result = b.add(new N.MixColor({ clampT: false }));
    b.connect(lumVec3).to(result, "a");
    b.connect(color).to(result, "b");
    b.connect(gi.intensity).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Saturation);
export default Saturation;
