// Mirror — graph-decomposed distortion.
//   d = rotate2D(uv − center, −angle)
//   d.x = abs(d.x) · side
//   finalUV = center + rotate2D(d, angle)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Mirror",
  description: "Reflect across an axis",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Mirror extends ProceduralEffect {
  static readonly typeId = "mirror";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "angle", type: "float", label: "Axis Angle", default: 90 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "side", type: "float", label: "Mirror Side", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const rad = b.add("math", { op: "mul" });
    b.connect(gi.angle, rad.nodeId, "a");
    b.connect(deg2rad, rad.nodeId, "b");
    const negRad = b.add("math", { op: "neg" });
    b.connect(rad, negRad.nodeId, "x");

    const centered = b.add("vector-math", { op: "sub" });
    b.connect(uv, centered.nodeId, "a");
    b.connect(c, centered.nodeId, "b");

    const rotNeg = b.add("vector-math", { op: "rotate-2d" });
    b.connect(centered, rotNeg.nodeId, "a");
    b.connect(negRad, rotNeg.nodeId, "b");

    const split = b.add("separate-xy", {});
    b.connect(rotNeg, split.nodeId, "v");
    const absX = b.add("math", { op: "abs" });
    b.connect({ nodeId: split.nodeId, pin: "x" }, absX.nodeId, "x");
    const flippedX = b.add("math", { op: "mul" });
    b.connect(absX, flippedX.nodeId, "a");
    b.connect(gi.side, flippedX.nodeId, "b");

    const mirrored = b.add("combine-xy", {});
    b.connect(flippedX, mirrored.nodeId, "x");
    b.connect({ nodeId: split.nodeId, pin: "y" }, mirrored.nodeId, "y");

    const rotBack = b.add("vector-math", { op: "rotate-2d" });
    b.connect(mirrored, rotBack.nodeId, "a");
    b.connect(rad, rotBack.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(c, finalUv.nodeId, "a");
    b.connect(rotBack, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Mirror);
export default Mirror;
