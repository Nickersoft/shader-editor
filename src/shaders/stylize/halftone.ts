// Halftone — graph-decomposed (classic mode only). Rotated cell UV from
// pixelate + a per-cell luma-driven dot mask. The CMYK plate variant uses
// four rotated lookups and can't decompose without a per-channel rotation
// helper; classic is the canonical halftone look.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Halftone",
  description: "Print-style dot screen — classic monochrome",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Halftone extends GraphEffectBase {
  static readonly typeId = "halftone";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "cells", type: "float", label: "Cells", default: 60 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 30 },
      { id: "softness", type: "float", label: "Softness", default: 0.05 },
      { id: "colorBack", type: "vec3", label: "Background", default: [1, 1, 1] },
      { id: "colorDot", type: "vec3", label: "Dot", default: [0, 0, 0] },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // Rotated UV around 0.5: q = rotate2D(uv − 0.5, angle) + 0.5.
    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");
    const centred = b.add("vector-math", { op: "sub" });
    b.connect(uv, centred.nodeId, "a");
    b.connect(halfV, centred.nodeId, "b");
    const aRad = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, aRad.nodeId, "x");
    const rot = b.add("vector-math", { op: "rotate-2d" });
    b.connect(centred, rot.nodeId, "a");
    b.connect(aRad, rot.nodeId, "b");
    const q = b.add("vector-math", { op: "add" });
    b.connect(rot, q.nodeId, "a");
    b.connect(halfV, q.nodeId, "b");

    // cellUv = fract(q · cells) − 0.5  (do this manually — pixelate snaps
    // to a *grid centre*, but we need the offset within each cell).
    const cellsV = b.add("combine-xy", {});
    b.connect(gi.cells, cellsV.nodeId, "x");
    b.connect(gi.cells, cellsV.nodeId, "y");
    const qc = b.add("vector-math", { op: "scale" });
    void qc;
    // Use vec2 component-wise mul: vector-math doesn't have it, so split and
    // re-combine.
    const sepQ = b.add("separate-xy", {});
    b.connect(q, sepQ.nodeId, "v");
    const qx = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepQ.nodeId, pin: "x" }, qx.nodeId, "a");
    b.connect(gi.cells, qx.nodeId, "b");
    const qy = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepQ.nodeId, pin: "y" }, qy.nodeId, "a");
    b.connect(gi.cells, qy.nodeId, "b");
    const qv = b.add("combine-xy", {});
    b.connect(qx, qv.nodeId, "x");
    b.connect(qy, qv.nodeId, "y");
    const frQ = b.add("vector-math", { op: "fract" });
    b.connect(qv, frQ.nodeId, "a");
    const cellUv = b.add("vector-math", { op: "sub" });
    b.connect(frQ, cellUv.nodeId, "a");
    b.connect(halfV, cellUv.nodeId, "b");

    // Sample luma at uv (un-rotated)
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, sample.nodeId, "uv");
    const lum = b.add("color-math", { op: "luminance" });
    b.connect({ nodeId: sample.nodeId, pin: "color" }, lum.nodeId, "a");

    // radius = (1 − lum) · 0.5
    const inv = b.add("math", { op: "oneminus" });
    b.connect(lum, inv.nodeId, "x");
    const radius = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(inv, radius.nodeId, "a");

    // d = length(cellUv); fillDot = 1 − smoothstep(radius − soft, radius + soft, d)
    const d = b.add("vector-math", { op: "length" });
    b.connect(cellUv, d.nodeId, "a");
    const e0 = b.add("math", { op: "sub" });
    b.connect(radius, e0.nodeId, "a");
    b.connect(gi.softness, e0.nodeId, "b");
    const e1 = b.add("math", { op: "add" });
    b.connect(radius, e1.nodeId, "a");
    b.connect(gi.softness, e1.nodeId, "b");
    const ss = b.add("smoothstep", {});
    b.connect(e0, ss.nodeId, "edge0");
    b.connect(e1, ss.nodeId, "edge1");
    b.connect(d, ss.nodeId, "x");
    const fillDot = b.add("math", { op: "oneminus" });
    b.connect(ss, fillDot.nodeId, "x");

    const out = b.add("mix-color", {});
    b.connect(gi.colorBack, out.nodeId, "a");
    b.connect(gi.colorDot, out.nodeId, "b");
    b.connect(fillDot, out.nodeId, "t");

    const one = b.add("value", { value: 1 });
    return b.output(out, one);
  }
}

register(Halftone);
export default Halftone;
