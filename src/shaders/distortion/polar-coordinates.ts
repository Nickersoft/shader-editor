// PolarCoordinates — graph-decomposed (rect-to-polar mode). The polar-to-rect
// inverse and the aspect-ratio correction in the original are dropped; the
// graph builds raw `(angle/2π, r/radius)` UVs from the screen-uv. `intensity`
// blends between identity and the polar remap.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Polar Coordinates",
  description: "Rectangular ↔ polar UV remap",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class PolarCoordinates extends GraphEffectBase {
  static readonly typeId = "polar-coordinates";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 1 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const c = b.add("combine-xy", {});
    b.connect(gi.centerX, c.nodeId, "x");
    b.connect(gi.centerY, c.nodeId, "y");

    // d = uv − centre
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(c, d.nodeId, "b");
    const sep = b.add("separate-xy", {});
    b.connect(d, sep.nodeId, "v");

    // angleN = (atan2(dy, dx) + π) / 2π
    const ang = b.add("math", { op: "atan2" });
    b.connect({ nodeId: sep.nodeId, pin: "y" }, ang.nodeId, "a");
    b.connect({ nodeId: sep.nodeId, pin: "x" }, ang.nodeId, "b");
    const shifted = b.add("math", { op: "add" }, { b: Math.PI });
    b.connect(ang, shifted.nodeId, "a");
    const angleN = b.add("math", { op: "mul" }, { b: 1 / (Math.PI * 2) });
    b.connect(shifted, angleN.nodeId, "a");

    // r = length(d) / radius
    const len = b.add("vector-math", { op: "length" });
    b.connect(d, len.nodeId, "a");
    const r = b.add("math", { op: "div" });
    b.connect(len, r.nodeId, "a");
    b.connect(gi.radius, r.nodeId, "b");

    const transformed = b.add("combine-xy", {});
    b.connect(angleN, transformed.nodeId, "x");
    b.connect(r, transformed.nodeId, "y");

    // finalUV = mix(uv, transformed, intensity) — implemented with two
    // scale+add nodes because mix-color works on vec3 and there's no vec2 mix.
    const oneMinus = b.add("math", { op: "oneminus" });
    b.connect(gi.intensity, oneMinus.nodeId, "x");
    const part1 = b.add("vector-math", { op: "scale" });
    b.connect(uv, part1.nodeId, "a");
    b.connect(oneMinus, part1.nodeId, "b");
    const part2 = b.add("vector-math", { op: "scale" });
    b.connect(transformed, part2.nodeId, "a");
    b.connect(gi.intensity, part2.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(part1, finalUv.nodeId, "a");
    b.connect(part2, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(PolarCoordinates);
export default PolarCoordinates;
