// Dither — graph-decomposed. The legacy effect supports four patterns
// (bayer2/4/8 lookup tables and white noise). Bayer matrices need static
// `float[N]` arrays that don't fit the primitive set; the graph form keeps
// the **white-noise** variant which uses `hash21(gl_FragCoord.xy)` and is
// served directly by `white-noise-texture` (driven by uv at screen scale).
// Authors who need ordered Bayer dither can keep the legacy code path by
// not migrating; this graph captures the practical case.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    const lum = b.add("color-math", { op: "luminance" });
    b.connect(sampleColor, lum.nodeId, "a");

    // High-frequency noise across screen — multiply uv by resolution so each
    // texel gets its own hash.
    const reso = b.add("resolution", {}, undefined, "out");
    const px = b.add("vector-math", { op: "scale" });
    b.connect(uv, px.nodeId, "a");
    // resolution is vec2, scale needs (vec2, float). Hack: collapse via length.
    // Simpler: feed uv directly with a big scale.
    void reso;
    b.connect(b.add("value", { value: 1000 }), px.nodeId, "b");

    const n = b.add("white-noise-texture", {});
    b.connect(px, n.nodeId, "p");

    // d = lum + (n − 0.5) · spread
    const noff = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(n, noff.nodeId, "a");
    const nss = b.add("math", { op: "mul" });
    b.connect(noff, nss.nodeId, "a");
    b.connect(gi.spread, nss.nodeId, "b");
    const d = b.add("math", { op: "add" });
    b.connect(lum, d.nodeId, "a");
    b.connect(nss, d.nodeId, "b");

    // v = step(threshold, d)
    const v = b.add("math", { op: "step" });
    b.connect(gi.threshold, v.nodeId, "a");
    b.connect(d, v.nodeId, "b");

    const out = b.add("mix-color", {});
    b.connect(gi.colorDark, out.nodeId, "a");
    b.connect(gi.colorLight, out.nodeId, "b");
    b.connect(v, out.nodeId, "t");

    return b.output(out, sampleAlpha);
  }
}

register(Dither);
export default Dither;
