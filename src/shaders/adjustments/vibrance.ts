// Vibrance — graph-decomposed adjustment.
//   mx = max(r, g, b)
//   avg = (r + g + b) / 3
//   amt = (mx - avg) * intensity * -3
//   result = mix(rgb, vec3(mx), amt)         // unclamped

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Vibrance",
  description: "Selective saturation adjustment protecting skin tones",
  color: "#a855f7",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Vibrance extends GraphEffectBase {
  static readonly typeId = "vibrance";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const split = b.add("separate-color", {});
    b.connect(color, split.nodeId, "v");
    const r = { nodeId: split.nodeId, pin: "r" };
    const g = { nodeId: split.nodeId, pin: "g" };
    const bPin = { nodeId: split.nodeId, pin: "b" };

    // mx = max(r, max(g, b))
    const mxGB = b.add("math", { op: "max" });
    b.connect(g, mxGB.nodeId, "a");
    b.connect(bPin, mxGB.nodeId, "b");
    const mx = b.add("math", { op: "max" });
    b.connect(r, mx.nodeId, "a");
    b.connect(mxGB, mx.nodeId, "b");

    // avg = (r + g + b) / 3
    const rg = b.add("math", { op: "add" });
    b.connect(r, rg.nodeId, "a");
    b.connect(g, rg.nodeId, "b");
    const sum = b.add("math", { op: "add" });
    b.connect(rg, sum.nodeId, "a");
    b.connect(bPin, sum.nodeId, "b");
    const three = b.add("value", { value: 3 });
    const avg = b.add("math", { op: "div" });
    b.connect(sum, avg.nodeId, "a");
    b.connect(three, avg.nodeId, "b");

    // amt = (mx - avg) * intensity * -3
    const diff = b.add("math", { op: "sub" });
    b.connect(mx, diff.nodeId, "a");
    b.connect(avg, diff.nodeId, "b");
    const amt0 = b.add("math", { op: "mul" });
    b.connect(diff, amt0.nodeId, "a");
    b.connect(gi.intensity, amt0.nodeId, "b");
    const negThree = b.add("value", { value: -3 });
    const amt = b.add("math", { op: "mul" });
    b.connect(amt0, amt.nodeId, "a");
    b.connect(negThree, amt.nodeId, "b");

    const mxVec3 = b.add("combine-color", {});
    b.connect(mx, mxVec3.nodeId, "r");
    b.connect(mx, mxVec3.nodeId, "g");
    b.connect(mx, mxVec3.nodeId, "b");

    const result = b.add("mix-color", { clampT: false });
    b.connect(color, result.nodeId, "a");
    b.connect(mxVec3, result.nodeId, "b");
    b.connect(amt, result.nodeId, "t");

    return b.output(result, alpha);
  }
}

register(Vibrance);
export default Vibrance;
