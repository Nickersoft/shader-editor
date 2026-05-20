// CrtScreen — graph-decomposed. Pixelate the sample UV, then apply a
// scanline modulation (sin of uv.y · freq · 2π), brightness/contrast, and
// a final vignette darkening. Composes from existing primitives end-to-end.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // cells = 1 / pixelSize; pixelate uses cells.
    const cells = b.add(new N.Math({ op: "div" }), { a: 1 });
    b.connect(gi.pixelSize).to(cells, "b");
    const cellsV = b.add(new N.CombineXy());
    b.connect(cells).to(cellsV, "x");
    b.connect(cells).to(cellsV, "y");
    const px = b.add(new N.Pixelate());
    b.connect(uv).to(px, "uv");
    b.connect(cellsV).to(px, "cells");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(px).to(sample, "uv");
    const sampleColor = { nodeId: sample.nodeId, pin: "color" };
    const sampleAlpha = { nodeId: sample.nodeId, pin: "alpha" };

    // scan = 0.5 + 0.5 · sin(uv.y · freq · 2π)
    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const ymul = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(ymul, "a");
    b.connect(gi.scanlineFrequency).to(ymul, "b");
    const y2pi = b.add(new N.Math({ op: "mul" }), { b: Math.PI * 2 });
    b.connect(ymul).to(y2pi, "a");
    const ys = b.add(new N.Math({ op: "sin" }));
    b.connect(y2pi).to(ys, "x");
    const ys5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(ys).to(ys5, "a");
    const scan = b.add(new N.Math({ op: "add" }), { b: 0.5 });
    b.connect(ys5).to(scan, "a");

    // scanned = sampleColor · mix(1, scan, 0.5)
    const sMixHalf = b.add(new N.Math({ op: "mix" }), { a: 1 });
    b.connect(scan).to(sMixHalf, "b");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(sMixHalf, "c");
    const scanned = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sampleColor).to(scanned, "a");
    b.connect(sMixHalf).to(scanned, "b");

    // contrast: col = (col − 0.5) · contrast + 0.5
    const negHalf = b.add(new N.Const({ value: -0.5 }));
    const shifted = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(scanned).to(shifted, "a");
    b.connect(negHalf).to(shifted, "b");
    const cScaled = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(shifted).to(cScaled, "a");
    b.connect(gi.contrast).to(cScaled, "b");
    const reshifted = b.add(new N.ColorMath({ op: "addScalar" }));
    b.connect(cScaled).to(reshifted, "a");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(reshifted, "b");

    // brightness scale
    const bright = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(reshifted).to(bright, "a");
    b.connect(gi.brightness).to(bright, "b");

    // Vignette: vig = smoothstep(vignetteRadius, vignetteRadius − 0.5, r)
    const half = b.add(new N.Const({ value: 0.5 }));
    const halfV = b.add(new N.CombineXy());
    b.connect(half).to(halfV, "x");
    b.connect(half).to(halfV, "y");
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(halfV).to(d, "b");
    const r = b.add(new N.VectorMath({ op: "length" }));
    b.connect(d).to(r, "a");
    const innerR = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(gi.vignetteRadius).to(innerR, "a");
    const vig = b.add(new N.Smoothstep());
    b.connect(gi.vignetteRadius).to(vig, "edge0");
    b.connect(innerR).to(vig, "edge1");
    b.connect(r).to(vig, "x");

    // col · vig as the darkened variant; mix(col, col · vig, vignetteIntensity)
    const dark = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(bright).to(dark, "a");
    b.connect(vig).to(dark, "b");
    const out = b.add(new N.MixColor());
    b.connect(bright).to(out, "a");
    b.connect(dark).to(out, "b");
    b.connect(gi.vignetteIntensity).to(out, "t");

    return b.output(out, sampleAlpha);
  }
}

register(CrtScreen);
export default CrtScreen;
