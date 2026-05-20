// Twirl — graph-decomposed distortion.
//   falloff = 1 − smoothstep(0, radius, length(uv − center))
//   angle_rad = angle_deg · π/180 · falloff
//   finalUV = center + rotate2D(uv − center, angle_rad)

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Twirl",
  description: "Local rotation, falls off with distance",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Twirl extends ProceduralEffect {
  static readonly typeId = "twirl";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.4 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 90 },
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

    const zero = b.add(new N.Const({ value: 0 }));
    const ss = b.add(new N.Smoothstep());
    b.connect(zero).to(ss, "edge0");
    b.connect(gi.radius).to(ss, "edge1");
    b.connect(r).to(ss, "x");

    const falloff = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(falloff, "x");

    const deg2rad = b.add(new N.Const({ value: Math.PI / 180 }));
    const rad = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.angle).to(rad, "a");
    b.connect(deg2rad).to(rad, "b");
    const angleRad = b.add(new N.Math({ op: "mul" }));
    b.connect(rad).to(angleRad, "a");
    b.connect(falloff).to(angleRad, "b");

    const rotated = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(d).to(rotated, "a");
    b.connect(angleRad).to(rotated, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(c).to(finalUv, "a");
    b.connect(rotated).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Twirl);
export default Twirl;
