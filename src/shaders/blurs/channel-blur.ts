// ChannelBlur — graph-decomposed. Three independent cross-blurs (H+V
// average each), one per channel, with amounts driven by per-channel
// intensity pins. The channel pick happens after the three separate blurs
// via combine-color.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type NodeHandle } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Channel Blur",
  description: "Independent blur for red, green, and blue channels",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class ChannelBlur extends ProceduralEffect {
  static readonly typeId = "channel-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "redIntensity", type: "float", label: "Red Intensity", default: 0 },
      { id: "greenIntensity", type: "float", label: "Green Intensity", default: 0 },
      { id: "blueIntensity", type: "float", label: "Blue Intensity", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const crossBlur = (amount: NodeHandle): NodeHandle => {
      const h = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
      b.connect(uv).to(h, "uv");
      b.connect(amount).to(h, "amount");
      b.connect(b.add(new N.Const({ value: 0 }))).to(h, "direction");
      const v = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
      b.connect(uv).to(v, "uv");
      b.connect(amount).to(v, "amount");
      b.connect(b.add(new N.Const({ value: 90 }))).to(v, "direction");
      const sum = b.add(new N.ColorMath({ op: "add" }));
      b.connect(h).to(sum, "a");
      b.connect(v).to(sum, "b");
      const avg = b.add(new N.ColorMath({ op: "scale" }));
      b.connect(sum).to(avg, "a");
      b.connect(b.add(new N.Const({ value: 0.5 }))).to(avg, "b");
      return avg;
    };

    const rBlur = crossBlur(gi.redIntensity);
    const gBlur = crossBlur(gi.greenIntensity);
    const bBlur = crossBlur(gi.blueIntensity);

    const sepR = b.add(new N.SeparateColor());
    b.connect(rBlur).to(sepR, "v");
    const sepG = b.add(new N.SeparateColor());
    b.connect(gBlur).to(sepG, "v");
    const sepB = b.add(new N.SeparateColor());
    b.connect(bBlur).to(sepB, "v");

    const out = b.add(new N.CombineColor());
    b.connect(sepR, "r").to(out, "r");
    b.connect(sepG, "g").to(out, "g");
    b.connect(sepB, "b").to(out, "b");

    const center = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(center, "uv");

    return b.output(out, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(ChannelBlur);
export default ChannelBlur;
