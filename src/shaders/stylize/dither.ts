// Dither — graph-decomposed. The legacy effect supports four patterns
// (bayer2/4/8 lookup tables and white noise). Bayer matrices need static
// `float[N]` arrays that don't fit the primitive set; the graph form keeps
// the **white-noise** variant which uses `hash21(gl_FragCoord.xy)` and is
// served directly by `white-noise-texture` (driven by uv at screen scale).
// Authors who need ordered Bayer dither can keep the legacy code path by
// not migrating; this graph captures the practical case.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Dither",
  description: "White-noise dither (2-color)",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Dither extends ProceduralEffect {
  static readonly typeId = "dither";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "threshold", type: "float", label: "Threshold", default: 0.5 },
      { id: "spread", type: "float", label: "Spread", default: 0.5 },
      { id: "colorDark", type: "vec3", label: "Dark", default: [0.05, 0.05, 0.1] },
      { id: "colorLight", type: "vec3", label: "Light", default: [1, 1, 0.95] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(sampleColor).to(lum, "a");

    // High-frequency noise across screen — multiply uv by resolution so each
    // texel gets its own hash.
    const reso = b.add(new N.Resolution(), undefined, "out");
    const px = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(uv).to(px, "a");
    // resolution is vec2, scale needs (vec2, float). Hack: collapse via length.
    // Simpler: feed uv directly with a big scale.
    void reso;
    b.connect(b.add(new N.Const({ value: 1000 }))).to(px, "b");

    const n = b.add(new N.Hash());
    b.connect(px).to(n, "p");

    // d = lum + (n − 0.5) · spread
    const noff = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(n).to(noff, "a");
    const nss = b.add(new N.Math({ op: "mul" }));
    b.connect(noff).to(nss, "a");
    b.connect(gi.spread).to(nss, "b");
    const d = b.add(new N.Math({ op: "add" }));
    b.connect(lum).to(d, "a");
    b.connect(nss).to(d, "b");

    // v = step(threshold, d)
    const v = b.add(new N.Math({ op: "step" }));
    b.connect(gi.threshold).to(v, "a");
    b.connect(d).to(v, "b");

    const out = b.add(new N.MixColor());
    b.connect(gi.colorDark).to(out, "a");
    b.connect(gi.colorLight).to(out, "b");
    b.connect(v).to(out, "t");

    return b.output(out, sampleAlpha);
  }
}

register(Dither);
export default Dither;
