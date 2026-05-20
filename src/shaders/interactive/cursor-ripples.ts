// CursorRipples — graph-decomposed. UV offset along the direction from the
// cursor, magnitude = sin(r·freq − t·speed) · exp(−r·decay) · intensity.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");
    const mouse = b.add(new N.Mouse(), undefined, "position");

    // p = uv − cursor; r = length(p); dir = p / r
    const p = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(p, "a");
    b.connect(mouse).to(p, "b");
    const r = b.add(new N.VectorMath({ op: "length" }));
    b.connect(p).to(r, "a");
    const dir = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(p).to(dir, "a");

    // wave = sin(r · freq − t · speed) · exp(−r · decay) · intensity
    const rf = b.add(new N.Math({ op: "mul" }));
    b.connect(r).to(rf, "a");
    b.connect(gi.frequency).to(rf, "b");
    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(ts, "a");
    b.connect(gi.speed).to(ts, "b");
    const phase = b.add(new N.Math({ op: "sub" }));
    b.connect(rf).to(phase, "a");
    b.connect(ts).to(phase, "b");
    const s = b.add(new N.Math({ op: "sin" }));
    b.connect(phase).to(s, "x");
    const rd = b.add(new N.Math({ op: "mul" }));
    b.connect(r).to(rd, "a");
    b.connect(gi.decay).to(rd, "b");
    const negRd = b.add(new N.Math({ op: "neg" }));
    b.connect(rd).to(negRd, "x");
    const expDecay = b.add(new N.Math({ op: "exp" }));
    b.connect(negRd).to(expDecay, "x");
    const wave1 = b.add(new N.Math({ op: "mul" }));
    b.connect(s).to(wave1, "a");
    b.connect(expDecay).to(wave1, "b");
    const wave = b.add(new N.Math({ op: "mul" }));
    b.connect(wave1).to(wave, "a");
    b.connect(gi.intensity).to(wave, "b");

    // offset = dir · wave · 0.05
    const w05 = b.add(new N.Math({ op: "mul" }), { b: 0.05 });
    b.connect(wave).to(w05, "a");
    const offset = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(offset, "a");
    b.connect(w05).to(offset, "b");

    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(finalUv, "a");
    b.connect(offset).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(CursorRipples);
export default CursorRipples;
