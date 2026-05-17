// ChannelBlur — graph-decomposed. Three independent cross-blurs (H+V
// average each), one per channel, with amounts driven by per-channel
// intensity pins. The channel pick happens after the three separate blurs
// via combine-color.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type PrevRef } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const crossBlur = (amount: PrevRef): PrevRef => {
      const h = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
      b.connect(uv, h.nodeId, "uv");
      b.connect(amount, h.nodeId, "amount");
      b.connect(b.add("value", { value: 0 }), h.nodeId, "direction");
      const v = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
      b.connect(uv, v.nodeId, "uv");
      b.connect(amount, v.nodeId, "amount");
      b.connect(b.add("value", { value: 90 }), v.nodeId, "direction");
      const sum = b.add("color-math", { op: "add" });
      b.connect(h, sum.nodeId, "a");
      b.connect(v, sum.nodeId, "b");
      const avg = b.add("color-math", { op: "scale" });
      b.connect(sum, avg.nodeId, "a");
      b.connect(b.add("value", { value: 0.5 }), avg.nodeId, "b");
      return avg;
    };

    const rBlur = crossBlur(gi.redIntensity);
    const gBlur = crossBlur(gi.greenIntensity);
    const bBlur = crossBlur(gi.blueIntensity);

    const sepR = b.add("separate-color", {});
    b.connect(rBlur, sepR.nodeId, "v");
    const sepG = b.add("separate-color", {});
    b.connect(gBlur, sepG.nodeId, "v");
    const sepB = b.add("separate-color", {});
    b.connect(bBlur, sepB.nodeId, "v");

    const out = b.add("combine-color", {});
    b.connect({ nodeId: sepR.nodeId, pin: "r" }, out.nodeId, "r");
    b.connect({ nodeId: sepG.nodeId, pin: "g" }, out.nodeId, "g");
    b.connect({ nodeId: sepB.nodeId, pin: "b" }, out.nodeId, "b");

    const center = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, center.nodeId, "uv");

    return b.output(out, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(ChannelBlur);
export default ChannelBlur;
