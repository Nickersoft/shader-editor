// CrtScreen — graph-decomposed. Pixelate the sample UV, then apply a
// scanline modulation (sin of uv.y · freq · 2π), brightness/contrast, and
// a final vignette darkening. Composes from existing primitives end-to-end.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "CRT Screen",
  description: "Pixelation, scanlines, brightness/contrast, and vignette",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class CrtScreen extends ProceduralEffect {
  static readonly typeId = "crt-screen";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "pixelSize", type: "float", label: "Pixel Size", default: 0.005 },
      { id: "scanlineFrequency", type: "float", label: "Scanline Frequency", default: 200 },
      { id: "brightness", type: "float", label: "Brightness", default: 1.1 },
      { id: "contrast", type: "float", label: "Contrast", default: 1.1 },
      { id: "vignetteRadius", type: "float", label: "Vignette Radius", default: 0.8 },
      { id: "vignetteIntensity", type: "float", label: "Vignette Intensity", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // cells = 1 / pixelSize; pixelate uses cells.
    const cells = b.add("math", { op: "div" }, { a: 1 });
    b.connect(gi.pixelSize, cells.nodeId, "b");
    const cellsV = b.add("combine-xy", {});
    b.connect(cells, cellsV.nodeId, "x");
    b.connect(cells, cellsV.nodeId, "y");
    const px = b.add("pixelate", {});
    b.connect(uv, px.nodeId, "uv");
    b.connect(cellsV, px.nodeId, "cells");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(px, sample.nodeId, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // scan = 0.5 + 0.5 · sin(uv.y · freq · 2π)
    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const ymul = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, ymul.nodeId, "a");
    b.connect(gi.scanlineFrequency, ymul.nodeId, "b");
    const y2pi = b.add("math", { op: "mul" }, { b: Math.PI * 2 });
    b.connect(ymul, y2pi.nodeId, "a");
    const ys = b.add("math", { op: "sin" });
    b.connect(y2pi, ys.nodeId, "x");
    const ys5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(ys, ys5.nodeId, "a");
    const scan = b.add("math", { op: "add" }, { b: 0.5 });
    b.connect(ys5, scan.nodeId, "a");

    // scanned = sampleColor · mix(1, scan, 0.5)
    const sMixHalf = b.add("math", { op: "mix" }, { a: 1 });
    b.connect(scan, sMixHalf.nodeId, "b");
    b.connect(b.add("value", { value: 0.5 }), sMixHalf.nodeId, "c");
    const scanned = b.add("color-math", { op: "scale" });
    b.connect(sampleColor, scanned.nodeId, "a");
    b.connect(sMixHalf, scanned.nodeId, "b");

    // contrast: col = (col − 0.5) · contrast + 0.5
    const negHalf = b.add("value", { value: -0.5 });
    const shifted = b.add("color-math", { op: "addScalar" });
    b.connect(scanned, shifted.nodeId, "a");
    b.connect(negHalf, shifted.nodeId, "b");
    const cScaled = b.add("color-math", { op: "scale" });
    b.connect(shifted, cScaled.nodeId, "a");
    b.connect(gi.contrast, cScaled.nodeId, "b");
    const reshifted = b.add("color-math", { op: "addScalar" });
    b.connect(cScaled, reshifted.nodeId, "a");
    b.connect(b.add("value", { value: 0.5 }), reshifted.nodeId, "b");

    // brightness scale
    const bright = b.add("color-math", { op: "scale" });
    b.connect(reshifted, bright.nodeId, "a");
    b.connect(gi.brightness, bright.nodeId, "b");

    // Vignette: vig = smoothstep(vignetteRadius, vignetteRadius − 0.5, r)
    const half = b.add("value", { value: 0.5 });
    const halfV = b.add("combine-xy", {});
    b.connect(half, halfV.nodeId, "x");
    b.connect(half, halfV.nodeId, "y");
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(halfV, d.nodeId, "b");
    const r = b.add("vector-math", { op: "length" });
    b.connect(d, r.nodeId, "a");
    const innerR = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(gi.vignetteRadius, innerR.nodeId, "a");
    const vig = b.add("smoothstep", {});
    b.connect(gi.vignetteRadius, vig.nodeId, "edge0");
    b.connect(innerR, vig.nodeId, "edge1");
    b.connect(r, vig.nodeId, "x");

    // col · vig as the darkened variant; mix(col, col · vig, vignetteIntensity)
    const dark = b.add("color-math", { op: "scale" });
    b.connect(bright, dark.nodeId, "a");
    b.connect(vig, dark.nodeId, "b");
    const out = b.add("mix-color", {});
    b.connect(bright, out.nodeId, "a");
    b.connect(dark, out.nodeId, "b");
    b.connect(gi.vignetteIntensity, out.nodeId, "t");

    return b.output(out, sampleAlpha);
  }
}

register(CrtScreen);
export default CrtScreen;
