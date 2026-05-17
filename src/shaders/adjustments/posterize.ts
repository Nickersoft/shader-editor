// Posterize — graph-decomposed adjustment.
//   result = floor(rgb * levels + 0.5) / levels
//
// The original effect declared levels as `int`; the graph version uses a
// `float` pin with step=1 in the UI so it composes cleanly through math nodes
// without an int→float conversion primitive.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Posterize",
  description: "Reduce color depth to create a poster effect",
  color: "#475569",
  category: "adjustments",
  defaultBlendMode: "normal",
};

export class Posterize extends ProceduralEffect {
  static readonly typeId = "posterize";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "levels", type: "float", label: "Levels", default: 6 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const scaled = b.add("color-math", { op: "scale" });
    b.connect(color, scaled.nodeId, "a");
    b.connect(gi.levels, scaled.nodeId, "b");

    const half = b.add("value", { value: 0.5 });
    const shifted = b.add("color-math", { op: "addScalar" });
    b.connect(scaled, shifted.nodeId, "a");
    b.connect(half, shifted.nodeId, "b");

    const floored = b.add("color-math", { op: "floor" });
    b.connect(shifted, floored.nodeId, "a");

    // result = floored / levels — there's no vec3/scale-divide op, so invert.
    const invLevels = b.add("math", { op: "div" });
    const one = b.add("value", { value: 1 });
    b.connect(one, invLevels.nodeId, "a");
    b.connect(gi.levels, invLevels.nodeId, "b");

    const result = b.add("color-math", { op: "scale" });
    b.connect(floored, result.nodeId, "a");
    b.connect(invLevels, result.nodeId, "b");

    return b.output(result, alpha);
  }
}

register(Posterize);
export default Posterize;
