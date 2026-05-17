// CursorRipples — graph-decomposed. UV offset along the direction from the
// cursor, magnitude = sin(r·freq − t·speed) · exp(−r·decay) · intensity.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Cursor Ripples",
  description: "Concentric ripples emanating from a center point",
  color: "#22d3ee",
  category: "interactive",
  defaultBlendMode: "normal",
};

export class CursorRipples extends ProceduralEffect {
  static readonly typeId = "cursor-ripples";
  static readonly meta = meta;
  static readonly scope = "scene" as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "frequency", type: "float", label: "Frequency", default: 10 },
      { id: "speed", type: "float", label: "Speed", default: 1 },
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "decay", type: "float", label: "Decay", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");
    const mouse = b.add("mouse", {}, undefined, "position");

    // p = uv − cursor; r = length(p); dir = p / r
    const p = b.add("vector-math", { op: "sub" });
    b.connect(uv, p.nodeId, "a");
    b.connect(mouse, p.nodeId, "b");
    const r = b.add("vector-math", { op: "length" });
    b.connect(p, r.nodeId, "a");
    const dir = b.add("vector-math", { op: "normalize" });
    b.connect(p, dir.nodeId, "a");

    // wave = sin(r · freq − t · speed) · exp(−r · decay) · intensity
    const rf = b.add("math", { op: "mul" });
    b.connect(r, rf.nodeId, "a");
    b.connect(gi.frequency, rf.nodeId, "b");
    const ts = b.add("math", { op: "mul" });
    b.connect(t, ts.nodeId, "a");
    b.connect(gi.speed, ts.nodeId, "b");
    const phase = b.add("math", { op: "sub" });
    b.connect(rf, phase.nodeId, "a");
    b.connect(ts, phase.nodeId, "b");
    const s = b.add("math", { op: "sin" });
    b.connect(phase, s.nodeId, "x");
    const rd = b.add("math", { op: "mul" });
    b.connect(r, rd.nodeId, "a");
    b.connect(gi.decay, rd.nodeId, "b");
    const negRd = b.add("math", { op: "neg" });
    b.connect(rd, negRd.nodeId, "x");
    const expDecay = b.add("math", { op: "exp" });
    b.connect(negRd, expDecay.nodeId, "x");
    const wave1 = b.add("math", { op: "mul" });
    b.connect(s, wave1.nodeId, "a");
    b.connect(expDecay, wave1.nodeId, "b");
    const wave = b.add("math", { op: "mul" });
    b.connect(wave1, wave.nodeId, "a");
    b.connect(gi.intensity, wave.nodeId, "b");

    // offset = dir · wave · 0.05
    const w05 = b.add("math", { op: "mul" }, { b: 0.05 });
    b.connect(wave, w05.nodeId, "a");
    const offset = b.add("vector-math", { op: "scale" });
    b.connect(dir, offset.nodeId, "a");
    b.connect(w05, offset.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(uv, finalUv.nodeId, "a");
    b.connect(offset, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(CursorRipples);
export default CursorRipples;
