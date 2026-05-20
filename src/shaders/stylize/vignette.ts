// Vignette — graph-decomposed. Uses `mask:vignette` to build a 0→1 falloff
// from centre to edge, then mixes the sampled image toward the tint colour
// by that mask × intensity.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Vignette",
  description: "Off-center radial darkening with configurable falloff",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Vignette extends ProceduralEffect {
  static readonly typeId = "vignette";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.7 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.3 },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "color", type: "vec3", label: "Color", default: [0, 0, 0] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const center = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(center, "x");
    b.connect(gi.centerY).to(center, "y");

    // mask:vignette outputs 1 inside the radius and falls to 0 across
    // `softness`. The legacy effect's geometry is inverted (0 at centre,
    // 1 at edge), so flip with oneminus and gate by intensity.
    const mask = b.add(new N.Mask({ shape: "vignette" }));
    b.connect(uv).to(mask, "uv");
    b.connect(center).to(mask, "center");
    b.connect(gi.radius).to(mask, "radius");
    b.connect(gi.falloff).to(mask, "softness");

    const edge = b.add(new N.Math({ op: "oneminus" }));
    b.connect(mask).to(edge, "x");

    const gated = b.add(new N.Math({ op: "mul" }));
    b.connect(edge).to(gated, "a");
    b.connect(gi.intensity).to(gated, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");

    const mixed = b.add(new N.MixColor());
    b.connect(sample, "color").to(mixed, "a");
    b.connect(gi.color).to(mixed, "b");
    b.connect(gated).to(mixed, "t");

    return b.output(mixed, { nodeId: sample.nodeId, pin: "alpha" });
  }
}

register(Vignette);
export default Vignette;
