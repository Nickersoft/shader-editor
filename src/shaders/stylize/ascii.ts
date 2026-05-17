// ASCII — graph-decomposed. Per-cell luma sampling drives a vertical-bar
// fill amount; a centred horizontal mask within each cell selects the
// final character pixels. The original supports an alpha threshold for
// transparency — that's kept by gating the output alpha.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // Pixelate-snap UV at `density × density` cells (square cells in UV space).
    const cellsV = b.add("combine-xy", {});
    b.connect(gi.density, cellsV.nodeId, "x");
    b.connect(gi.density, cellsV.nodeId, "y");
    const px = b.add("pixelate", {});
    b.connect(uv, px.nodeId, "uv");
    b.connect(cellsV, px.nodeId, "cells");

    // Per-cell sample colour at the snapped UV.
    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(px, sample.nodeId, "uv");
    const lum = b.add("color-math", { op: "luminance" });
    b.connect({ nodeId: sample.nodeId, pin: "color" }, lum.nodeId, "a");
    // toned = pow(lum, 1/gamma)
    const invGamma = b.add("math", { op: "div" }, { a: 1 });
    b.connect(gi.gamma, invGamma.nodeId, "b");
    const toned = b.add("math", { op: "pow" });
    b.connect(lum, toned.nodeId, "a");
    b.connect(invGamma, toned.nodeId, "b");
    const bars = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(toned, bars.nodeId, "a");
    const barsF = b.add("math", { op: "floor" });
    b.connect(bars, barsF.nodeId, "x");

    // cellUv = fract(uv · cells); fill = step(cellUv.y, bars · 0.25 + 0.05);
    // bar = step(|cellUv.x − 0.5|, 0.4) · fill
    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const ux = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "x" }, ux.nodeId, "a");
    b.connect(gi.density, ux.nodeId, "b");
    const uy = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, uy.nodeId, "a");
    b.connect(gi.density, uy.nodeId, "b");
    const fx = b.add("math", { op: "fract" });
    b.connect(ux, fx.nodeId, "x");
    const fy = b.add("math", { op: "fract" });
    b.connect(uy, fy.nodeId, "x");

    const bars25 = b.add("math", { op: "mul" }, { b: 0.25 });
    b.connect(barsF, bars25.nodeId, "a");
    const fillThr = b.add("math", { op: "add" }, { b: 0.05 });
    b.connect(bars25, fillThr.nodeId, "a");
    const fill = b.add("math", { op: "step" });
    b.connect(fy, fill.nodeId, "a");
    b.connect(fillThr, fill.nodeId, "b");

    const fx05 = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(fx, fx05.nodeId, "a");
    const absFx = b.add("math", { op: "abs" });
    b.connect(fx05, absFx.nodeId, "x");
    const bar = b.add("math", { op: "step" });
    b.connect(absFx, bar.nodeId, "a");
    b.connect(b.add("value", { value: 0.4 }), bar.nodeId, "b");
    const barFill = b.add("math", { op: "mul" });
    b.connect(bar, barFill.nodeId, "a");
    b.connect(fill, barFill.nodeId, "b");

    const out = b.add("mix-color", {});
    b.connect(gi.colorBack, out.nodeId, "a");
    b.connect(gi.colorChar, out.nodeId, "b");
    b.connect(barFill, out.nodeId, "t");

    // Alpha: srcA · step(alphaThreshold, srcA)
    const srcAt = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, srcAt.nodeId, "uv");
    const gate = b.add("math", { op: "step" });
    b.connect(gi.alphaThreshold, gate.nodeId, "a");
    b.connect({ nodeId: srcAt.nodeId, pin: "alpha" }, gate.nodeId, "b");
    const outA = b.add("math", { op: "mul" });
    b.connect({ nodeId: srcAt.nodeId, pin: "alpha" }, outA.nodeId, "a");
    b.connect(gate, outA.nodeId, "b");

    return b.output(out, outA);
  }
}

register(Ascii);
export default Ascii;
