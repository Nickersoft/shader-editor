// Kaleidoscope — graph-decomposed distortion.
//   d = uv − center;  r = length(d);  a = atan2(d.y, d.x) + rotation·π/180
//   seg = 2π / segments
//   a = abs(mod(a, seg) − seg·0.5)
//   finalUV = center + vec2(cos(a), sin(a)) · r

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Kaleidoscope",
  description: "N-fold radial mirror",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Kaleidoscope extends GraphEffectBase {
  static readonly typeId = "kaleidoscope";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "segments", type: "float", label: "Segments", default: 8 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "rotation", type: "float", label: "Rotation", default: 0 },
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

    const split = b.add("separate-xy", {});
    b.connect(d, split.nodeId, "v");

    const baseAng = b.add("math", { op: "atan2" });
    b.connect({ nodeId: split.nodeId, pin: "y" }, baseAng.nodeId, "a");
    b.connect({ nodeId: split.nodeId, pin: "x" }, baseAng.nodeId, "b");

    const deg2rad = b.add("value", { value: Math.PI / 180 });
    const rotRad = b.add("math", { op: "mul" });
    b.connect(gi.rotation, rotRad.nodeId, "a");
    b.connect(deg2rad, rotRad.nodeId, "b");

    const ang = b.add("math", { op: "add" });
    b.connect(baseAng, ang.nodeId, "a");
    b.connect(rotRad, ang.nodeId, "b");

    const twoPi = b.add("value", { value: 2 * Math.PI });
    const seg = b.add("math", { op: "div" });
    b.connect(twoPi, seg.nodeId, "a");
    b.connect(gi.segments, seg.nodeId, "b");

    const half = b.add("value", { value: 0.5 });
    const halfSeg = b.add("math", { op: "mul" });
    b.connect(seg, halfSeg.nodeId, "a");
    b.connect(half, halfSeg.nodeId, "b");

    const modded = b.add("math", { op: "mod" });
    b.connect(ang, modded.nodeId, "a");
    b.connect(seg, modded.nodeId, "b");

    const folded = b.add("math", { op: "sub" });
    b.connect(modded, folded.nodeId, "a");
    b.connect(halfSeg, folded.nodeId, "b");

    const absA = b.add("math", { op: "abs" });
    b.connect(folded, absA.nodeId, "x");

    const cosA = b.add("math", { op: "cos" });
    b.connect(absA, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(absA, sinA.nodeId, "x");

    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");

    const rd = b.add("vector-math", { op: "scale" });
    b.connect(dir, rd.nodeId, "a");
    b.connect(r, rd.nodeId, "b");

    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(c, finalUv.nodeId, "a");
    b.connect(rd, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Kaleidoscope);
export default Kaleidoscope;
