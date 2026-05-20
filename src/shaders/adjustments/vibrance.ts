// Vibrance — graph-decomposed adjustment.
//   mx = max(r, g, b)
//   avg = (r + g + b) / 3
//   amt = (mx - avg) * intensity * -3
//   result = mix(rgb, vec3(mx), amt)         // unclamped

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Vibrance",
  description: "Selective saturation adjustment protecting skin tones",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Vibrance extends ProceduralEffect {
  static readonly typeId = "vibrance";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const split = b.add(new N.SeparateColor());
    b.connect(color).to(split, "v");
    const r = { nodeId: split.nodeId, pin: "r" };
    const g = { nodeId: split.nodeId, pin: "g" };
    const bPin = { nodeId: split.nodeId, pin: "b" };

    // mx = max(r, max(g, b))
    const mxGB = b.add(new N.Math({ op: "max" }));
    b.connect(g).to(mxGB, "a");
    b.connect(bPin).to(mxGB, "b");
    const mx = b.add(new N.Math({ op: "max" }));
    b.connect(r).to(mx, "a");
    b.connect(mxGB).to(mx, "b");

    // avg = (r + g + b) / 3
    const rg = b.add(new N.Math({ op: "add" }));
    b.connect(r).to(rg, "a");
    b.connect(g).to(rg, "b");
    const sum = b.add(new N.Math({ op: "add" }));
    b.connect(rg).to(sum, "a");
    b.connect(bPin).to(sum, "b");
    const three = b.add(new N.Const({ value: 3 }));
    const avg = b.add(new N.Math({ op: "div" }));
    b.connect(sum).to(avg, "a");
    b.connect(three).to(avg, "b");

    // amt = (mx - avg) * intensity * -3
    const diff = b.add(new N.Math({ op: "sub" }));
    b.connect(mx).to(diff, "a");
    b.connect(avg).to(diff, "b");
    const amt0 = b.add(new N.Math({ op: "mul" }));
    b.connect(diff).to(amt0, "a");
    b.connect(gi.intensity).to(amt0, "b");
    const negThree = b.add(new N.Const({ value: -3 }));
    const amt = b.add(new N.Math({ op: "mul" }));
    b.connect(amt0).to(amt, "a");
    b.connect(negThree).to(amt, "b");

    const mxVec3 = b.add(new N.CombineColor());
    b.connect(mx).to(mxVec3, "r");
    b.connect(mx).to(mxVec3, "g");
    b.connect(mx).to(mxVec3, "b");

    const result = b.add(new N.MixColor({ clampT: false }));
    b.connect(color).to(result, "a");
    b.connect(mxVec3).to(result, "b");
    b.connect(amt).to(result, "t");

    return b.output(result, alpha);
  }
}

register(Vibrance);
export default Vibrance;
