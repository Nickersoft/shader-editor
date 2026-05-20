// Posterize — graph-decomposed adjustment.
//   result = floor(rgb * levels + 0.5) / levels
//
// The original effect declared levels as `int`; the graph version uses a
// `float` pin with step=1 in the UI so it composes cleanly through math nodes
// without an int→float conversion primitive.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const color = { nodeId: sample.nodeId, pin: "color" };
    const alpha = { nodeId: sample.nodeId, pin: "alpha" };

    const scaled = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(color).to(scaled, "a");
    b.connect(gi.levels).to(scaled, "b");

    const half = b.add(new N.Const({ value: 0.5 }));
    const shifted = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(scaled).to(shifted, "a");
    b.connect(half).to(shifted, "b");

    const floored = b.add(new N.ColorMath({ op: "floor" }));
    b.connect(shifted).to(floored, "a");

    // result = floored / levels — there's no vec3/scale-divide op, so invert.
    const invLevels = b.add(new N.Math({ op: "div" }));
    const one = b.add(new N.Const({ value: 1 }));
    b.connect(one).to(invLevels, "a");
    b.connect(gi.levels).to(invLevels, "b");

    const result = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(floored).to(result, "a");
    b.connect(invLevels).to(result, "b");

    return b.output(result, alpha);
  }
}

register(Posterize);
export default Posterize;
