// WaveDistortion — graph-decomposed (sine waveform). The original effect
// supports five waveforms (sine/triangle/square/sawtooth/bounce), but only
// sine maps cleanly to a single math:sin node — the others need fract / abs
// chains that don't fit a small graph. We keep the sine variant in the graph;
// authors who need other wave shapes can swap math:sin for math:fract +
// further ops.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Wave Distortion",
  description: "Periodic UV displacement along a direction",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class WaveDistortion extends ProceduralEffect {
  static readonly typeId = "wave-distortion";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "amplitude", type: "float", label: "Amplitude", default: 0.05 },
      { id: "frequency", type: "float", label: "Frequency", default: 5 },
      { id: "speed", type: "float", label: "Speed", default: 1 },
      { id: "angle", type: "float", label: "Direction (deg)", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // ar (radians)
    const ar = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(ar, "x");
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(ar).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(ar).to(sinA, "x");
    // dir = (cos, sin); perp = (−sin, cos)
    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");
    const negSin = b.add(new N.Math({ op: "neg" }));
    b.connect(sinA).to(negSin, "x");
    const perp = b.add(new N.CombineXy());
    b.connect(negSin).to(perp, "x");
    b.connect(cosA).to(perp, "y");

    // phase = dot(dir, uv) · frequency + time · speed
    const dt = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(dir).to(dt, "a");
    b.connect(uv).to(dt, "b");
    const phaseSpace = b.add(new N.Math({ op: "mul" }));
    b.connect(dt).to(phaseSpace, "a");
    b.connect(gi.frequency).to(phaseSpace, "b");
    const phaseTime = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(phaseTime, "a");
    b.connect(gi.speed).to(phaseTime, "b");
    const phase = b.add(new N.Math({ op: "add" }));
    b.connect(phaseSpace).to(phase, "a");
    b.connect(phaseTime).to(phase, "b");

    // w = sin(phase · 2π)
    const phase2pi = b.add(new N.Math({ op: "mul" }), { b: Math.PI * 2 });
    b.connect(phase).to(phase2pi, "a");
    const w = b.add(new N.Math({ op: "sin" }));
    b.connect(phase2pi).to(w, "x");

    // offset = perp · w · amplitude
    const wa = b.add(new N.Math({ op: "mul" }));
    b.connect(w).to(wa, "a");
    b.connect(gi.amplitude).to(wa, "b");
    const off = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(perp).to(off, "a");
    b.connect(wa).to(off, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(finalUv, "a");
    b.connect(off).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(WaveDistortion);
export default WaveDistortion;
