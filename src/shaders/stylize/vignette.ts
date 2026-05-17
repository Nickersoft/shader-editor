// Vignette — graph-decomposed. Uses `mask:vignette` to build a 0→1 falloff
// from centre to edge, then mixes the sampled image toward the tint colour
// by that mask × intensity.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const center = b.add("combine-xy", {});
    b.connect(gi.centerX, center.nodeId, "x");
    b.connect(gi.centerY, center.nodeId, "y");

    // mask:vignette outputs 1 inside the radius and falls to 0 across
    // `softness`. The legacy effect's geometry is inverted (0 at centre,
    // 1 at edge), so flip with oneminus and gate by intensity.
    const mask = b.add("mask", { shape: "vignette" });
    b.connect(uv, mask.nodeId, "uv");
    b.connect(center, mask.nodeId, "center");
    b.connect(gi.radius, mask.nodeId, "radius");
    b.connect(gi.falloff, mask.nodeId, "softness");

    const edge = b.add("math", { op: "oneminus" });
    b.connect(mask, edge.nodeId, "x");

    const gated = b.add("math", { op: "mul" });
    b.connect(edge, gated.nodeId, "a");
    b.connect(gi.intensity, gated.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");

    const mixed = b.add("mix-color", {});
    b.connect({ nodeId: sample.nodeId, pin: "color" }, mixed.nodeId, "a");
    b.connect(gi.color, mixed.nodeId, "b");
    b.connect(gated, mixed.nodeId, "t");

    return b.output(mixed, { nodeId: sample.nodeId, pin: "alpha" });
  }
}

register(Vignette);
export default Vignette;
