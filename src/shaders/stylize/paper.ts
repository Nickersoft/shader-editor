// Paper — graph-decomposed. The 4-octave simplex sum maps exactly to
// `noise-texture(kind=fbm, detail=4, lacunarity=2, roughness=0.5)`. Each
// channel is offset by (n − 0.5) · displacement, then mixed with the
// untouched sample by `roughness`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // Noise position: q = uv * frequency. The `seed` in the legacy effect
    // shifts both axes; noise-texture's `seed` does the same internally,
    // so we route the user pin straight into the primitive's config-derived
    // seed by baking a single multiply here for `frequency` only.
    const q = b.add("vector-math", { op: "scale" });
    b.connect(uv, q.nodeId, "a");
    b.connect(gi.frequency, q.nodeId, "b");

    const fbm = b.add("noise-texture", {
      kind: "fbm",
      scale: 1,
      detail: 4,
      lacunarity: 2,
      roughness: 0.5,
      distortion: 0,
      seed: 0,
    });
    b.connect(q, fbm.nodeId, "p");
    b.connect(gi.seed, fbm.nodeId, "t");

    // disp = rgb + (n − 0.5) · displacement   (broadcast across channels)
    const offset = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(fbm, offset.nodeId, "a");
    const scaled = b.add("math", { op: "mul" });
    b.connect(offset, scaled.nodeId, "a");
    b.connect(gi.displacement, scaled.nodeId, "b");
    const dispRgb = b.add("combine-color", {});
    b.connect(scaled, dispRgb.nodeId, "r");
    b.connect(scaled, dispRgb.nodeId, "g");
    b.connect(scaled, dispRgb.nodeId, "b");
    const disp = b.add("color-math", { op: "add" });
    b.connect(sampleColor, disp.nodeId, "a");
    b.connect(dispRgb, disp.nodeId, "b");

    const mixed = b.add("mix-color", {});
    b.connect(sampleColor, mixed.nodeId, "a");
    b.connect(disp, mixed.nodeId, "b");
    b.connect(gi.roughness, mixed.nodeId, "t");

    return b.output(mixed, sampleAlpha);
  }
}

register(Paper);
export default Paper;
