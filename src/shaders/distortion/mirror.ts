// Mirror — graph-decomposed distortion.
//   d = rotate2D(uv − center, −angle)
//   d.x = abs(d.x) · side
//   finalUV = center + rotate2D(d, angle)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const rad = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.angle).to(rad, "a");
    b.connect(deg2rad).to(rad, "b");
    const negRad = b.add(new N.Math({ op: "neg" }));
    b.connect(rad).to(negRad, "x");

    const centered = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(centered, "a");
    b.connect(c).to(centered, "b");

    const rotNeg = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(centered).to(rotNeg, "a");
    b.connect(negRad).to(rotNeg, "b");

    const split = b.add(new N.SeparateXy());
    b.connect(rotNeg).to(split, "v");
    const absX = b.add(new N.Math({ op: "abs" }));
    b.connect(split, "x").to(absX, "x");
    const flippedX = b.add(new N.Math({ op: "mul" }));
    b.connect(absX).to(flippedX, "a");
    b.connect(gi.side).to(flippedX, "b");

    const mirrored = b.add(new N.CombineXy());
    b.connect(flippedX).to(mirrored, "x");
    b.connect(split, "y").to(mirrored, "y");

    const rotBack = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(mirrored).to(rotBack, "a");
    b.connect(rad).to(rotBack, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(c).to(finalUv, "a");
    b.connect(rotBack).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Mirror);
export default Mirror;
