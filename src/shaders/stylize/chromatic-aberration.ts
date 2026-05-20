// ChromaticAberration — graph-decomposed. Three sample-previous-pass nodes
// at uv−off / uv / uv+off, pick R from the first and B from the third, then
// repack the three channels via combine-color.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Chromatic Aberration",
  description: "Aspect-corrected RGB channel offset along an angle",
  color: "#ef4444",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class ChromaticAberration extends ProceduralEffect {
  static readonly typeId = "chromatic-aberration";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "strength", type: "float", label: "Strength", default: 0.5 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // angle to radians
    const angleRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(angleRad, "x");

    // direction = vec2(cos(a), sin(a))
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(angleRad).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(angleRad).to(sinA, "x");
    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");

    // off = dir * (strength * 0.01)
    const scaled = b.add(new N.Math({ op: "mul" }), { b: 0.01 });
    b.connect(gi.strength).to(scaled, "a");
    const off = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(off, "a");
    b.connect(scaled).to(off, "b");

    // R: sample at uv − off
    const uvR = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(uvR, "a");
    b.connect(off).to(uvR, "b");
    const sampleR = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uvR).to(sampleR, "uv");

    // G: sample at uv (centre, also drives alpha)
    const sampleG = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sampleG, "uv");

    // B: sample at uv + off
    const uvB = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(uvB, "a");
    b.connect(off).to(uvB, "b");
    const sampleB = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uvB).to(sampleB, "uv");

    // Repack: R from R-sample, G from G-sample, B from B-sample.
    const sepR = b.add(new N.SeparateColor());
    b.connect(sampleR, "color").to(sepR, "v");
    const sepG = b.add(new N.SeparateColor());
    b.connect(sampleG, "color").to(sepG, "v");
    const sepB = b.add(new N.SeparateColor());
    b.connect(sampleB, "color").to(sepB, "v");

    const out = b.add(new N.CombineColor());
    b.connect(sepR, "r").to(out, "r");
    b.connect(sepG, "g").to(out, "g");
    b.connect(sepB, "b").to(out, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(ChromaticAberration);
export default ChromaticAberration;
