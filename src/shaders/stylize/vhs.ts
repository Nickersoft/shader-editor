// VHS — graph-decomposed (simplified). The legacy effect builds tape damage
// envelopes from a custom smooth-noise function and emits per-scanline
// hashes for chroma/luma row offsets; that level of detail doesn't fit the
// primitive set cleanly. The graph form captures the dominant visual
// elements:
//   • global X wobble from two fbm samples at different frequencies
//   • per-row hash-jitter (white noise over floor(uv.y · 487))
//   • chroma smear: 4 horizontal samples weighted into a YIQ-ish blend
//   • slow AC-mains beat on the final brightness
// The head-switching burst and tape-crease scrolling are dropped.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "VHS",
  description:
    "Analog VHS tape with wobble, scanline jitter, chroma smear, and AC beat",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Vhs extends ProceduralEffect {
  static readonly typeId = "vhs";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "wobble", type: "float", label: "Wobble", default: 1 },
      { id: "scanlineNoise", type: "float", label: "Scanline Noise", default: 0.6 },
      { id: "smear", type: "float", label: "Smear", default: 0.2 },
      { id: "speed", type: "float", label: "Speed", default: 1 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");
    const ts = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(ts, "a");
    b.connect(gi.speed).to(ts, "b");

    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const uvY = { nodeId: sepUv.nodeId, pin: "y" };

    // Slow tape wave: fbm(vec2(uv.y · 3, ts · 0.8)) − 0.5
    const w1y = b.add(new N.Math({ op: "mul" }), { b: 3 });
    b.connect(uvY).to(w1y, "a");
    const w1t = b.add(new N.Math({ op: "mul" }), { b: 0.8 });
    b.connect(ts).to(w1t, "a");
    const w1v = b.add(new N.CombineXy());
    b.connect(w1y).to(w1v, "x");
    b.connect(w1t).to(w1v, "y");
    const w1n = b.add(new N.NoiseTexture({
      kind: "fbm", scale: 1, seed: 0, detail: 2,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(w1v).to(w1n, "p");
    const wave1 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(w1n).to(wave1, "a");

    // Fast tape wave: fbm(vec2(uv.y · 30, ts · 6)) − 0.5
    const w2y = b.add(new N.Math({ op: "mul" }), { b: 30 });
    b.connect(uvY).to(w2y, "a");
    const w2t = b.add(new N.Math({ op: "mul" }), { b: 6 });
    b.connect(ts).to(w2t, "a");
    const w2v = b.add(new N.CombineXy());
    b.connect(w2y).to(w2v, "x");
    b.connect(w2t).to(w2v, "y");
    const w2n = b.add(new N.NoiseTexture({
      kind: "fbm", scale: 1, seed: 0, detail: 2,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    }));
    b.connect(w2v).to(w2n, "p");
    const wave2 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(w2n).to(wave2, "a");

    // tapeWave = (wave1 · 0.008 + wave2 · 0.002) · wobble
    const w1s = b.add(new N.Math({ op: "mul" }), { b: 0.008 });
    b.connect(wave1).to(w1s, "a");
    const w2s = b.add(new N.Math({ op: "mul" }), { b: 0.002 });
    b.connect(wave2).to(w2s, "a");
    const wsum = b.add(new N.Math({ op: "add" }));
    b.connect(w1s).to(wsum, "a");
    b.connect(w2s).to(wsum, "b");
    const tapeWave = b.add(new N.Math({ op: "mul" }));
    b.connect(wsum).to(tapeWave, "a");
    b.connect(gi.wobble).to(tapeWave, "b");

    // Per-row hash jitter: hash(vec2(floor(uv.y · 487), floor(ts))) · 0.008
    const row = b.add(new N.Math({ op: "mul" }), { b: 487 });
    b.connect(uvY).to(row, "a");
    const rowF = b.add(new N.Math({ op: "floor" }));
    b.connect(row).to(rowF, "x");
    const tsF = b.add(new N.Math({ op: "floor" }));
    b.connect(ts).to(tsF, "x");
    const rowV = b.add(new N.CombineXy());
    b.connect(rowF).to(rowV, "x");
    b.connect(tsF).to(rowV, "y");
    const rowH = b.add(new N.Hash());
    b.connect(rowV).to(rowH, "p");
    const rowH5 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(rowH).to(rowH5, "a");
    const rowH2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(rowH5).to(rowH2, "a");
    const rowJ1 = b.add(new N.Math({ op: "mul" }));
    b.connect(rowH2).to(rowJ1, "a");
    b.connect(gi.scanlineNoise).to(rowJ1, "b");
    const rowJ = b.add(new N.Math({ op: "mul" }), { b: 0.008 });
    b.connect(rowJ1).to(rowJ, "a");

    // globalX = tapeWave + rowJ
    const globalX = b.add(new N.Math({ op: "add" }));
    b.connect(tapeWave).to(globalX, "a");
    b.connect(rowJ).to(globalX, "b");

    const globalXv = b.add(new N.CombineXy(), { y: 0 });
    b.connect(globalX).to(globalXv, "x");
    const shiftedUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(shiftedUv, "a");
    b.connect(globalXv).to(shiftedUv, "b");

    // 4-tap horizontal smear: sample at shiftedUv + vec2(i · smearScale, 0)
    // for i in {-1.5, -0.5, +0.5, +1.5}, average with equal weights.
    const smearScale = b.add(new N.Math({ op: "mul" }), { b: 0.0075 });
    b.connect(gi.smear).to(smearScale, "a");
    const tap = (mul: number) => {
      const k = b.add(new N.Math({ op: "mul" }), { b: mul });
      b.connect(smearScale).to(k, "a");
      const v = b.add(new N.CombineXy(), { y: 0 });
      b.connect(k).to(v, "x");
      const u = b.add(new N.VectorMath({ op: "add" }));
      b.connect(shiftedUv).to(u, "a");
      b.connect(v).to(u, "b");
      const s = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
      b.connect(u).to(s, "uv");
      return s;
    };
    const s1 = tap(-1.5);
    const s2 = tap(-0.5);
    const s3 = tap(0.5);
    const s4 = tap(1.5);
    const sum1 = b.add(new N.ColorMath({ op: "add" }));
    b.connect(s1, "color").to(sum1, "a");
    b.connect(s2, "color").to(sum1, "b");
    const sum2 = b.add(new N.ColorMath({ op: "add" }));
    b.connect(s3, "color").to(sum2, "a");
    b.connect(s4, "color").to(sum2, "b");
    const sumAll = b.add(new N.ColorMath({ op: "add" }));
    b.connect(sum1).to(sumAll, "a");
    b.connect(sum2).to(sumAll, "b");
    const avg = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sumAll).to(avg, "a");
    b.connect(b.add(new N.Const({ value: 0.25 }))).to(avg, "b");

    // AC beat: 1 + cos(mod(ts, 2π) · 2 + uv.y · 0.5) · 0.015 · wobble
    const tsMod = b.add(new N.Math({ op: "mod" }), { b: Math.PI * 2 });
    b.connect(ts).to(tsMod, "a");
    const tsMod2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(tsMod).to(tsMod2, "a");
    const uvY5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(uvY).to(uvY5, "a");
    const acP = b.add(new N.Math({ op: "add" }));
    b.connect(tsMod2).to(acP, "a");
    b.connect(uvY5).to(acP, "b");
    const acC = b.add(new N.Math({ op: "cos" }));
    b.connect(acP).to(acC, "x");
    const acS = b.add(new N.Math({ op: "mul" }), { b: 0.015 });
    b.connect(acC).to(acS, "a");
    const acW = b.add(new N.Math({ op: "mul" }));
    b.connect(acS).to(acW, "a");
    b.connect(gi.wobble).to(acW, "b");
    const acBeat = b.add(new N.Math({ op: "add" }), { a: 1 });
    b.connect(acW).to(acBeat, "b");

    const beated = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(avg).to(beated, "a");
    b.connect(acBeat).to(beated, "b");

    return b.output(beated, { nodeId: s2.nodeId, pin: "alpha" });
  }
}

register(Vhs);
export default Vhs;
