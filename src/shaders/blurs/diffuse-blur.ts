// DiffuseBlur — graph-decomposed. Two `grain` samples (decorrelated by a
// constant seed-offset on the time input) drive a vec2 jitter applied to the
// sample UV. `seed` shifts the noise; `intensity` scales the offset.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Diffuse Blur",
  description: "Random-jitter blur (painterly softness)",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class DiffuseBlur extends GraphEffectBase {
  static readonly typeId = "diffuse-blur";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // The legacy effect scales jitter by `intensity * texel * 50` —
    // approximate that with a fixed 0.05 unit-UV scale (the texel × 50 term
    // is roughly 0.05 at 1920×1080 resolution). Authors who need a different
    // scale can edit the multiplier in the graph.
    const jitterAmount = b.add("math", { op: "mul" }, { b: 0.05 });
    b.connect(gi.intensity, jitterAmount.nodeId, "a");

    // Two grain samples on the same UV with different time-seeds give the
    // x / y components of the jitter direction.
    const gx = b.add("grain", {});
    b.connect(uv, gx.nodeId, "uv");
    b.connect(gi.seed, gx.nodeId, "time");
    b.connect(jitterAmount, gx.nodeId, "intensity");

    const seedY = b.add("math", { op: "add" }, { b: 1 });
    b.connect(gi.seed, seedY.nodeId, "a");
    const gy = b.add("grain", {});
    b.connect(uv, gy.nodeId, "uv");
    b.connect(seedY, gy.nodeId, "time");
    b.connect(jitterAmount, gy.nodeId, "intensity");

    const offset = b.add("combine-xy", {});
    b.connect(gx, offset.nodeId, "x");
    b.connect(gy, offset.nodeId, "y");

    const jittered = b.add("vector-math", { op: "add" });
    b.connect(uv, jittered.nodeId, "a");
    b.connect(offset, jittered.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(jittered, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(DiffuseBlur);
export default DiffuseBlur;
