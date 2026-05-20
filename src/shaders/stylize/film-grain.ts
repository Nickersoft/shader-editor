// FilmGrain — graph-decomposed. The `grain` primitive emits [-intensity,
// +intensity] noise; we add that to the sampled image, weighted by a
// smoothstep over luminance (biased by `bias`) to push grain toward bright
// or dark regions.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Film Grain",
  description: "Per-pixel grain biased toward dark or light areas",
  color: "#a3a3a3",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class FilmGrain extends ProceduralEffect {
  static readonly typeId = "film-grain";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.3 },
      { id: "bias", type: "float", label: "Bias", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    const grain = b.add(new N.Grain());
    b.connect(uv).to(grain, "uv");
    b.connect(t).to(grain, "time");
    b.connect(gi.intensity).to(grain, "intensity");

    // grain is a float; convert to vec3 by combine-color so we can add to
    // an RGB sample.
    const grainRgb = b.add(new N.CombineColor());
    b.connect(grain).to(grainRgb, "r");
    b.connect(grain).to(grainRgb, "g");
    b.connect(grain).to(grainRgb, "b");

    const grainy = b.add(new N.ColorMath({ op: "add" }));
    b.connect(sampleColor).to(grainy, "a");
    b.connect(grainRgb).to(grainy, "b");

    // Luminance weighting: w = smoothstep(0, 0.5 + bias, luma(rgb))
    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(sampleColor).to(lum, "a");

    const edge1 = b.add(new N.Math({ op: "add" }), { a: 0.5 });
    b.connect(gi.bias).to(edge1, "b");

    const w = b.add(new N.Smoothstep(), { edge0: 0 });
    b.connect(edge1).to(w, "edge1");
    b.connect(lum).to(w, "x");

    const mixed = b.add(new N.MixColor());
    b.connect(sampleColor).to(mixed, "a");
    b.connect(grainy).to(mixed, "b");
    b.connect(w).to(mixed, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(FilmGrain);
export default FilmGrain;
