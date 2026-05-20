// ASCII — graph-decomposed. Per-cell luma sampling drives a vertical-bar
// fill amount; a centred horizontal mask within each cell selects the
// final character pixels. The original supports an alpha threshold for
// transparency — that's kept by gating the output alpha.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "ASCII",
  description: "Coarse ASCII-like dot density",
  color: "#475569",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Ascii extends ProceduralEffect {
  static readonly typeId = "ascii";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "density", type: "float", label: "Density", default: 80 },
      { id: "gamma", type: "float", label: "Gamma", default: 1 },
      { id: "alphaThreshold", type: "float", label: "Alpha Threshold", default: 0.05 },
      { id: "colorBack", type: "vec3", label: "Background", default: [0, 0, 0] },
      { id: "colorChar", type: "vec3", label: "Character", default: [0.4, 1, 0.5] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // Pixelate-snap UV at `density × density` cells (square cells in UV space).
    const cellsV = b.add(new N.CombineXy());
    b.connect(gi.density).to(cellsV, "x");
    b.connect(gi.density).to(cellsV, "y");
    const px = b.add(new N.Pixelate());
    b.connect(uv).to(px, "uv");
    b.connect(cellsV).to(px, "cells");

    // Per-cell sample colour at the snapped UV.
    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(px).to(sample, "uv");
    const lum = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(sample, "color").to(lum, "a");
    // toned = pow(lum, 1/gamma)
    const invGamma = b.add(new N.Math({ op: "div" }), { a: 1 });
    b.connect(gi.gamma).to(invGamma, "b");
    const toned = b.add(new N.Math({ op: "pow" }));
    b.connect(lum).to(toned, "a");
    b.connect(invGamma).to(toned, "b");
    const bars = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(toned).to(bars, "a");
    const barsF = b.add(new N.Math({ op: "floor" }));
    b.connect(bars).to(barsF, "x");

    // cellUv = fract(uv · cells); fill = step(cellUv.y, bars · 0.25 + 0.05);
    // bar = step(|cellUv.x − 0.5|, 0.4) · fill
    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const ux = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "x").to(ux, "a");
    b.connect(gi.density).to(ux, "b");
    const uy = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(uy, "a");
    b.connect(gi.density).to(uy, "b");
    const fx = b.add(new N.Math({ op: "fract" }));
    b.connect(ux).to(fx, "x");
    const fy = b.add(new N.Math({ op: "fract" }));
    b.connect(uy).to(fy, "x");

    const bars25 = b.add(new N.Math({ op: "mul" }), { b: 0.25 });
    b.connect(barsF).to(bars25, "a");
    const fillThr = b.add(new N.Math({ op: "add" }), { b: 0.05 });
    b.connect(bars25).to(fillThr, "a");
    const fill = b.add(new N.Math({ op: "step" }));
    b.connect(fy).to(fill, "a");
    b.connect(fillThr).to(fill, "b");

    const fx05 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(fx).to(fx05, "a");
    const absFx = b.add(new N.Math({ op: "abs" }));
    b.connect(fx05).to(absFx, "x");
    const bar = b.add(new N.Math({ op: "step" }));
    b.connect(absFx).to(bar, "a");
    b.connect(b.add(new N.Const({ value: 0.4 }))).to(bar, "b");
    const barFill = b.add(new N.Math({ op: "mul" }));
    b.connect(bar).to(barFill, "a");
    b.connect(fill).to(barFill, "b");

    const out = b.add(new N.MixColor());
    b.connect(gi.colorBack).to(out, "a");
    b.connect(gi.colorChar).to(out, "b");
    b.connect(barFill).to(out, "t");

    // Alpha: srcA · step(alphaThreshold, srcA)
    const srcAt = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(srcAt, "uv");
    const gate = b.add(new N.Math({ op: "step" }));
    b.connect(gi.alphaThreshold).to(gate, "a");
    b.connect(srcAt, "alpha").to(gate, "b");
    const outA = b.add(new N.Math({ op: "mul" }));
    b.connect(srcAt, "alpha").to(outA, "a");
    b.connect(gate).to(outA, "b");

    return b.output(out, outA);
  }
}

register(Ascii);
export default Ascii;
