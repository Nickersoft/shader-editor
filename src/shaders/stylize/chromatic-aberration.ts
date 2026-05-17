// ChromaticAberration — graph-decomposed. Three sample-previous-pass nodes
// at uv−off / uv / uv+off, pick R from the first and B from the third, then
// repack the three channels via combine-color.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // angle to radians
    const angleRad = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, angleRad.nodeId, "x");

    // direction = vec2(cos(a), sin(a))
    const cosA = b.add("math", { op: "cos" });
    b.connect(angleRad, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(angleRad, sinA.nodeId, "x");
    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");

    // off = dir * (strength * 0.01)
    const scaled = b.add("math", { op: "mul" }, { b: 0.01 });
    b.connect(gi.strength, scaled.nodeId, "a");
    const off = b.add("vector-math", { op: "scale" });
    b.connect(dir, off.nodeId, "a");
    b.connect(scaled, off.nodeId, "b");

    // R: sample at uv − off
    const uvR = b.add("vector-math", { op: "sub" });
    b.connect(uv, uvR.nodeId, "a");
    b.connect(off, uvR.nodeId, "b");
    const sampleR = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvR, sampleR.nodeId, "uv");

    // G: sample at uv (centre, also drives alpha)
    const sampleG = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sampleG.nodeId, "uv");

    // B: sample at uv + off
    const uvB = b.add("vector-math", { op: "add" });
    b.connect(uv, uvB.nodeId, "a");
    b.connect(off, uvB.nodeId, "b");
    const sampleB = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvB, sampleB.nodeId, "uv");

    // Repack: R from R-sample, G from G-sample, B from B-sample.
    const sepR = b.add("separate-color", {});
    b.connect({ nodeId: sampleR.nodeId, pin: "color" }, sepR.nodeId, "v");
    const sepG = b.add("separate-color", {});
    b.connect({ nodeId: sampleG.nodeId, pin: "color" }, sepG.nodeId, "v");
    const sepB = b.add("separate-color", {});
    b.connect({ nodeId: sampleB.nodeId, pin: "color" }, sepB.nodeId, "v");

    const out = b.add("combine-color", {});
    b.connect({ nodeId: sepR.nodeId, pin: "r" }, out.nodeId, "r");
    b.connect({ nodeId: sepG.nodeId, pin: "g" }, out.nodeId, "g");
    b.connect({ nodeId: sepB.nodeId, pin: "b" }, out.nodeId, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(ChromaticAberration);
export default ChromaticAberration;
