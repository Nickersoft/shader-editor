// WaveDistortion — graph-decomposed (sine waveform). The original effect
// supports five waveforms (sine/triangle/square/sawtooth/bounce), but only
// sine maps cleanly to a single math:sin node — the others need fract / abs
// chains that don't fit a small graph. We keep the sine variant in the graph;
// authors who need other wave shapes can swap math:sin for math:fract +
// further ops.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Wave Distortion",
  description: "Periodic UV displacement along a direction",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class WaveDistortion extends GraphEffectBase {
  static readonly typeId = "wave-distortion";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "amplitude", type: "float", label: "Amplitude", default: 0.05 },
      { id: "frequency", type: "float", label: "Frequency", default: 5 },
      { id: "speed", type: "float", label: "Speed", default: 1 },
      { id: "angle", type: "float", label: "Direction (deg)", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // ar (radians)
    const ar = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, ar.nodeId, "x");
    const cosA = b.add("math", { op: "cos" });
    b.connect(ar, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(ar, sinA.nodeId, "x");
    // dir = (cos, sin); perp = (−sin, cos)
    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");
    const negSin = b.add("math", { op: "neg" });
    b.connect(sinA, negSin.nodeId, "x");
    const perp = b.add("combine-xy", {});
    b.connect(negSin, perp.nodeId, "x");
    b.connect(cosA, perp.nodeId, "y");

    // phase = dot(dir, uv) · frequency + time · speed
    const dt = b.add("vector-math", { op: "dot" });
    b.connect(dir, dt.nodeId, "a");
    b.connect(uv, dt.nodeId, "b");
    const phaseSpace = b.add("math", { op: "mul" });
    b.connect(dt, phaseSpace.nodeId, "a");
    b.connect(gi.frequency, phaseSpace.nodeId, "b");
    const phaseTime = b.add("math", { op: "mul" });
    b.connect(t, phaseTime.nodeId, "a");
    b.connect(gi.speed, phaseTime.nodeId, "b");
    const phase = b.add("math", { op: "add" });
    b.connect(phaseSpace, phase.nodeId, "a");
    b.connect(phaseTime, phase.nodeId, "b");

    // w = sin(phase · 2π)
    const phase2pi = b.add("math", { op: "mul" }, { b: Math.PI * 2 });
    b.connect(phase, phase2pi.nodeId, "a");
    const w = b.add("math", { op: "sin" });
    b.connect(phase2pi, w.nodeId, "x");

    // offset = perp · w · amplitude
    const wa = b.add("math", { op: "mul" });
    b.connect(w, wa.nodeId, "a");
    b.connect(gi.amplitude, wa.nodeId, "b");
    const off = b.add("vector-math", { op: "scale" });
    b.connect(perp, off.nodeId, "a");
    b.connect(wa, off.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(uv, finalUv.nodeId, "a");
    b.connect(off, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(WaveDistortion);
export default WaveDistortion;
