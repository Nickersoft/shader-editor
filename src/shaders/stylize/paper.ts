// Paper — graph-decomposed. The 4-octave simplex sum maps exactly to
// `noise-texture(kind=fbm, detail=4, lacunarity=2, roughness=0.5)`. Each
// channel is offset by (n − 0.5) · displacement, then mixed with the
// untouched sample by `roughness`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Paper",
  description: "Multi-octave paper-fiber overlay",
  color: "#fef3c7",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Paper extends ProceduralEffect {
  static readonly typeId = "paper";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "displacement", type: "float", label: "Displacement", default: 0.5 },
      { id: "frequency", type: "float", label: "Frequency", default: 10 },
      { id: "roughness", type: "float", label: "Roughness", default: 0.5 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // Noise position: q = uv * frequency. The `seed` in the legacy effect
    // shifts both axes; noise-texture's `seed` does the same internally,
    // so we route the user pin straight into the primitive's config-derived
    // seed by baking a single multiply here for `frequency` only.
    const q = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(q, "a");
    b.connect(gi.frequency).to(q, "b");

    const fbm = b.add(new N.NoiseTexture({
      kind: "fbm",
      scale: 1,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    }));
    b.connect(q).to(fbm, "p");
    b.connect(gi.seed).to(fbm, "t");

    // disp = rgb + (n − 0.5) · displacement   (broadcast across channels)
    const offset = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(fbm).to(offset, "a");
    const scaled = b.add(new N.Math({ op: "mul" }));
    b.connect(offset).to(scaled, "a");
    b.connect(gi.displacement).to(scaled, "b");
    const dispRgb = b.add(new N.CombineColor());
    b.connect(scaled).to(dispRgb, "r");
    b.connect(scaled).to(dispRgb, "g");
    b.connect(scaled).to(dispRgb, "b");
    const disp = b.add(new N.ColorMath({ op: "add" }));
    b.connect(sampleColor).to(disp, "a");
    b.connect(dispRgb).to(disp, "b");

    const mixed = b.add(new N.MixColor());
    b.connect(sampleColor).to(mixed, "a");
    b.connect(disp).to(mixed, "b");
    b.connect(gi.roughness).to(mixed, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(Paper);
export default Paper;
