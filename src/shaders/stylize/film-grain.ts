// FilmGrain — graph-decomposed. The `grain` primitive emits [-intensity,
// +intensity] noise; we add that to the sampled image, weighted by a
// smoothstep over luminance (biased by `bias`) to push grain toward bright
// or dark regions.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Film Grain",
  description: "Per-pixel grain biased toward dark or light areas",
  color: "#a3a3a3",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class FilmGrain extends GraphEffectBase {
  static readonly typeId = "film-grain";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "bias", type: "float", label: "Bias", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    const grain = b.add("grain", {});
    b.connect(uv, grain.nodeId, "uv");
    b.connect(t, grain.nodeId, "time");
    b.connect(gi.intensity, grain.nodeId, "intensity");

    // grain is a float; convert to vec3 by combine-color so we can add to
    // an RGB sample.
    const grainRgb = b.add("combine-color", {});
    b.connect(grain, grainRgb.nodeId, "r");
    b.connect(grain, grainRgb.nodeId, "g");
    b.connect(grain, grainRgb.nodeId, "b");

    const grainy = b.add("color-math", { op: "add" });
    b.connect(sampleColor, grainy.nodeId, "a");
    b.connect(grainRgb, grainy.nodeId, "b");

    // Luminance weighting: w = smoothstep(0, 0.5 + bias, luma(rgb))
    const lum = b.add("color-math", { op: "luminance" });
    b.connect(sampleColor, lum.nodeId, "a");

    const edge1 = b.add("math", { op: "add" }, { a: 0.5 });
    b.connect(gi.bias, edge1.nodeId, "b");

    const w = b.add("smoothstep", {}, { edge0: 0 });
    b.connect(edge1, w.nodeId, "edge1");
    b.connect(lum, w.nodeId, "x");

    const mixed = b.add("mix-color", {});
    b.connect(sampleColor, mixed.nodeId, "a");
    b.connect(grainy, mixed.nodeId, "b");
    b.connect(w, mixed.nodeId, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(FilmGrain);
export default FilmGrain;
