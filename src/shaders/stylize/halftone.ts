// Halftone — graph-decomposed (classic mode only). Rotated cell UV from
// pixelate + a per-cell luma-driven dot mask. The CMYK plate variant uses
// four rotated lookups and can't decompose without a per-channel rotation
// helper; classic is the canonical halftone look.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Halftone",
  description: "Print-style dot screen — classic monochrome",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Halftone extends ProceduralEffect {
  static readonly typeId = "halftone";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "cells", type: "float", label: "Cells", default: 60 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 30 },
      { id: "softness", type: "float", label: "Softness", default: 0.05 },
      { id: "colorBack", type: "vec3", label: "Background", default: [1, 1, 1] },
      { id: "colorDot", type: "vec3", label: "Dot", default: [0, 0, 0] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // Rotated UV around 0.5: q = rotate2D(uv − 0.5, angle) + 0.5.
    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");
    const centred = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(centred, "a");
    b.connect(halfV).to(centred, "b");
    const aRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(aRad, "x");
    const rot = b.add(new N.VectorMath({ op: "rotate-2d" }));
    b.connect(centred).to(rot, "a");
    b.connect(aRad).to(rot, "b");
    const q = b.add(new N.VectorMath({ op: "add" }));
    b.connect(rot).to(q, "a");
    b.connect(halfV).to(q, "b");

    // cellUv = fract(q · cells) − 0.5  (do this manually — pixelate snaps
    // to a *grid centre*, but we need the offset within each cell).
    const cellsV = b.add(new N.CombineXy());
    b.connect(gi.cells).to(cellsV, "x");
    b.connect(gi.cells).to(cellsV, "y");
    const qc = b.add(new N.VectorMath({ op: "scale" }));
    void qc;
    // Use vec2 component-wise mul: vector-math doesn't have it, so split and
    // re-combine.
    const sepQ = b.add(new N.SeparateXy());
    b.connect(q).to(sepQ, "v");
    const qx = b.add(new N.Math({ op: "mul" }));
    b.connect(sepQ, "x").to(qx, "a");
    b.connect(gi.cells).to(qx, "b");
    const qy = b.add(new N.Math({ op: "mul" }));
    b.connect(sepQ, "y").to(qy, "a");
    b.connect(gi.cells).to(qy, "b");
    const qv = b.add(new N.CombineXy());
    b.connect(qx).to(qv, "x");
    b.connect(qy).to(qv, "y");
    const frQ = b.add(new N.VectorMath({ op: "fract" }));
    b.connect(qv).to(frQ, "a");
    const cellUv = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(frQ).to(cellUv, "a");
    b.connect(halfV).to(cellUv, "b");

    // Sample luma at uv (un-rotated)
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(sample, "uv");
    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(sample, "color").to(lum, "a");

    // radius = (1 − lum) · 0.5
    const inv = b.add(new N.Math({ op: "oneminus" }));
    b.connect(lum).to(inv, "x");
    const radius = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(inv).to(radius, "a");

    // d = length(cellUv); fillDot = 1 − smoothstep(radius − soft, radius + soft, d)
    const d = b.add(new N.VectorMath({ op: "length" }));
    b.connect(cellUv).to(d, "a");
    const e0 = b.add(new N.Math({ op: "sub" }));
    b.connect(radius).to(e0, "a");
    b.connect(gi.softness).to(e0, "b");
    const e1 = b.add(new N.Math({ op: "add" }));
    b.connect(radius).to(e1, "a");
    b.connect(gi.softness).to(e1, "b");
    const ss = b.add(new N.Smoothstep());
    b.connect(e0).to(ss, "edge0");
    b.connect(e1).to(ss, "edge1");
    b.connect(d).to(ss, "x");
    const fillDot = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(fillDot, "x");

    const out = b.add(new N.MixColor());
    b.connect(gi.colorBack).to(out, "a");
    b.connect(gi.colorDot).to(out, "b");
    b.connect(fillDot).to(out, "t");

    const one = b.add(new N.Const({ value: 1 }));
    return b.output(out, one);
  }
}

register(Halftone);
export default Halftone;
