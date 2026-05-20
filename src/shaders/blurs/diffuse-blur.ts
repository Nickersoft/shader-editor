// DiffuseBlur — graph-decomposed. Two `grain` samples (decorrelated by a
// constant seed-offset on the time input) drive a vec2 jitter applied to the
// sample UV. `seed` shifts the noise; `intensity` scales the offset.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Diffuse Blur",
  description: "Random-jitter blur (painterly softness)",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class DiffuseBlur extends ProceduralEffect {
  static readonly typeId = "diffuse-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // The legacy effect scales jitter by `intensity * texel * 50` —
    // approximate that with a fixed 0.05 unit-UV scale (the texel × 50 term
    // is roughly 0.05 at 1920×1080 resolution). Authors who need a different
    // scale can edit the multiplier in the graph.
    const jitterAmount = b.add(new N.Math({ op: "mul" }), { b: 0.05 });
    b.connect(gi.intensity).to(jitterAmount, "a");

    // Two grain samples on the same UV with different time-seeds give the
    // x / y components of the jitter direction.
    const gx = b.add(new N.Grain());
    b.connect(uv).to(gx, "uv");
    b.connect(gi.seed).to(gx, "time");
    b.connect(jitterAmount).to(gx, "intensity");

    const seedY = b.add(new N.Math({ op: "add" }), { b: 1 });
    b.connect(gi.seed).to(seedY, "a");
    const gy = b.add(new N.Grain());
    b.connect(uv).to(gy, "uv");
    b.connect(seedY).to(gy, "time");
    b.connect(jitterAmount).to(gy, "intensity");

    const offset = b.add(new N.CombineXy());
    b.connect(gx).to(offset, "x");
    b.connect(gy).to(offset, "y");

    const jittered = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(jittered, "a");
    b.connect(offset).to(jittered, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(jittered).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(DiffuseBlur);
export default DiffuseBlur;
