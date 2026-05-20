// Kaleidoscope — graph-decomposed distortion.
//   d = uv − center;  r = length(d);  a = atan2(d.y, d.x) + rotation·π/180
//   seg = 2π / segments
//   a = abs(mod(a, seg) − seg·0.5)
//   finalUV = center + vec2(cos(a), sin(a)) · r

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Kaleidoscope",
  description: "N-fold radial mirror",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Kaleidoscope extends ProceduralEffect {
  static readonly typeId = "kaleidoscope";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "segments", type: "float", label: "Segments", default: 8 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "rotation", type: "float", label: "Rotation", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const c = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(c, "x");
    b.connect(gi.centerY).to(c, "y");

    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(c).to(d, "b");

    const r = b.add(new N.VectorMath({ op: "length" }));
    b.connect(d).to(r, "a");

    const split = b.add(new N.SeparateXy());
    b.connect(d).to(split, "v");

    const baseAng = b.add(new N.Math({ op: "atan2" }));
    b.connect(split, "y").to(baseAng, "a");
    b.connect(split, "x").to(baseAng, "b");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const rotRad = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.rotation).to(rotRad, "a");
    b.connect(deg2rad).to(rotRad, "b");

    const ang = b.add(new N.Math({ op: "add" }));
    b.connect(baseAng).to(ang, "a");
    b.connect(rotRad).to(ang, "b");

    const twoPi = b.add(new N.Const({ value: 2 * Math.PI }));
    const seg = b.add(new N.Math({ op: "div" }));
    b.connect(twoPi).to(seg, "a");
    b.connect(gi.segments).to(seg, "b");

    const half = b.add(new N.Const({ value: 0.5 }));
    const halfSeg = b.add(new N.Math({ op: "mul" }));
    b.connect(seg).to(halfSeg, "a");
    b.connect(half).to(halfSeg, "b");

    const modded = b.add(new N.Math({ op: "mod" }));
    b.connect(ang).to(modded, "a");
    b.connect(seg).to(modded, "b");

    const folded = b.add(new N.Math({ op: "sub" }));
    b.connect(modded).to(folded, "a");
    b.connect(halfSeg).to(folded, "b");

    const absA = b.add(new N.Math({ op: "abs" }));
    b.connect(folded).to(absA, "x");

    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(absA).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(absA).to(sinA, "x");

    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");

    const rd = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(rd, "a");
    b.connect(r).to(rd, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(c).to(finalUv, "a");
    b.connect(rd).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Kaleidoscope);
export default Kaleidoscope;
