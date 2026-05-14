// Twirl — graph-decomposed distortion.
//   falloff = 1 − smoothstep(0, radius, length(uv − center))
//   angle_rad = angle_deg · π/180 · falloff
//   finalUV = center + rotate2D(uv − center, angle_rad)

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Twirl",
  description: "Local rotation, falls off with distance",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Twirl extends GraphEffectBase {
  static readonly typeId = "twirl";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.4 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 90 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(c, d.nodeId, "b");

    const r = b.add("vector-math", { op: "length" });
    b.connect(d, r.nodeId, "a");

    const zero = b.add("value", { value: 0 });
    const ss = b.add("smoothstep", {});
    b.connect(zero, ss.nodeId, "edge0");
    b.connect(gi.radius, ss.nodeId, "edge1");
    b.connect(r, ss.nodeId, "x");

    const falloff = b.add("math", { op: "oneminus" });
    b.connect(ss, falloff.nodeId, "x");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const rad = b.add("math", { op: "mul" });
    b.connect(gi.angle, rad.nodeId, "a");
    b.connect(deg2rad, rad.nodeId, "b");
    const angleRad = b.add("math", { op: "mul" });
    b.connect(rad, angleRad.nodeId, "a");
    b.connect(falloff, angleRad.nodeId, "b");

    const rotated = b.add("vector-math", { op: "rotate-2d" });
    b.connect(d, rotated.nodeId, "a");
    b.connect(angleRad, rotated.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(c, finalUv.nodeId, "a");
    b.connect(rotated, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Twirl);
export default Twirl;
