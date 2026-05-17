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
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");
    const ts = b.add("math", { op: "mul" });
    b.connect(t, ts.nodeId, "a");
    b.connect(gi.speed, ts.nodeId, "b");

    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const uvY = { nodeId: sepUv.nodeId, pin: "y" };

    // Slow tape wave: fbm(vec2(uv.y · 3, ts · 0.8)) − 0.5
    const w1y = b.add("math", { op: "mul" }, { b: 3 });
    b.connect(uvY, w1y.nodeId, "a");
    const w1t = b.add("math", { op: "mul" }, { b: 0.8 });
    b.connect(ts, w1t.nodeId, "a");
    const w1v = b.add("combine-xy", {});
    b.connect(w1y, w1v.nodeId, "x");
    b.connect(w1t, w1v.nodeId, "y");
    const w1n = b.add("noise-texture", {
      kind: "fbm", scale: 1, seed: 0, detail: 2,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(w1v, w1n.nodeId, "p");
    const wave1 = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(w1n, wave1.nodeId, "a");

    // Fast tape wave: fbm(vec2(uv.y · 30, ts · 6)) − 0.5
    const w2y = b.add("math", { op: "mul" }, { b: 30 });
    b.connect(uvY, w2y.nodeId, "a");
    const w2t = b.add("math", { op: "mul" }, { b: 6 });
    b.connect(ts, w2t.nodeId, "a");
    const w2v = b.add("combine-xy", {});
    b.connect(w2y, w2v.nodeId, "x");
    b.connect(w2t, w2v.nodeId, "y");
    const w2n = b.add("noise-texture", {
      kind: "fbm", scale: 1, seed: 0, detail: 2,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(w2v, w2n.nodeId, "p");
    const wave2 = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(w2n, wave2.nodeId, "a");

    // tapeWave = (wave1 · 0.008 + wave2 · 0.002) · wobble
    const w1s = b.add("math", { op: "mul" }, { b: 0.008 });
    b.connect(wave1, w1s.nodeId, "a");
    const w2s = b.add("math", { op: "mul" }, { b: 0.002 });
    b.connect(wave2, w2s.nodeId, "a");
    const wsum = b.add("math", { op: "add" });
    b.connect(w1s, wsum.nodeId, "a");
    b.connect(w2s, wsum.nodeId, "b");
    const tapeWave = b.add("math", { op: "mul" });
    b.connect(wsum, tapeWave.nodeId, "a");
    b.connect(gi.wobble, tapeWave.nodeId, "b");

    // Per-row hash jitter: hash(vec2(floor(uv.y · 487), floor(ts))) · 0.008
    const row = b.add("math", { op: "mul" }, { b: 487 });
    b.connect(uvY, row.nodeId, "a");
    const rowF = b.add("math", { op: "floor" });
    b.connect(row, rowF.nodeId, "x");
    const tsF = b.add("math", { op: "floor" });
    b.connect(ts, tsF.nodeId, "x");
    const rowV = b.add("combine-xy", {});
    b.connect(rowF, rowV.nodeId, "x");
    b.connect(tsF, rowV.nodeId, "y");
    const rowH = b.add("white-noise-texture", {});
    b.connect(rowV, rowH.nodeId, "p");
    const rowH5 = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(rowH, rowH5.nodeId, "a");
    const rowH2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(rowH5, rowH2.nodeId, "a");
    const rowJ1 = b.add("math", { op: "mul" });
    b.connect(rowH2, rowJ1.nodeId, "a");
    b.connect(gi.scanlineNoise, rowJ1.nodeId, "b");
    const rowJ = b.add("math", { op: "mul" }, { b: 0.008 });
    b.connect(rowJ1, rowJ.nodeId, "a");

    // globalX = tapeWave + rowJ
    const globalX = b.add("math", { op: "add" });
    b.connect(tapeWave, globalX.nodeId, "a");
    b.connect(rowJ, globalX.nodeId, "b");

    const globalXv = b.add("combine-xy", {}, { y: 0 });
    b.connect(globalX, globalXv.nodeId, "x");
    const shiftedUv = b.add("vector-math", { op: "add" });
    b.connect(uv, shiftedUv.nodeId, "a");
    b.connect(globalXv, shiftedUv.nodeId, "b");

    // 4-tap horizontal smear: sample at shiftedUv + vec2(i · smearScale, 0)
    // for i in {-1.5, -0.5, +0.5, +1.5}, average with equal weights.
    const smearScale = b.add("math", { op: "mul" }, { b: 0.0075 });
    b.connect(gi.smear, smearScale.nodeId, "a");
    const tap = (mul: number) => {
      const k = b.add("math", { op: "mul" }, { b: mul });
      b.connect(smearScale, k.nodeId, "a");
      const v = b.add("combine-xy", {}, { y: 0 });
      b.connect(k, v.nodeId, "x");
      const u = b.add("vector-math", { op: "add" });
      b.connect(shiftedUv, u.nodeId, "a");
      b.connect(v, u.nodeId, "b");
      const s = b.add("sample-previous-pass", { edges: "stretch" });
      b.connect(u, s.nodeId, "uv");
      return s;
    };
    const s1 = tap(-1.5);
    const s2 = tap(-0.5);
    const s3 = tap(0.5);
    const s4 = tap(1.5);
    const sum1 = b.add("color-math", { op: "add" });
    b.connect({ nodeId: s1.nodeId, pin: "color" }, sum1.nodeId, "a");
    b.connect({ nodeId: s2.nodeId, pin: "color" }, sum1.nodeId, "b");
    const sum2 = b.add("color-math", { op: "add" });
    b.connect({ nodeId: s3.nodeId, pin: "color" }, sum2.nodeId, "a");
    b.connect({ nodeId: s4.nodeId, pin: "color" }, sum2.nodeId, "b");
    const sumAll = b.add("color-math", { op: "add" });
    b.connect(sum1, sumAll.nodeId, "a");
    b.connect(sum2, sumAll.nodeId, "b");
    const avg = b.add("color-math", { op: "scale" });
    b.connect(sumAll, avg.nodeId, "a");
    b.connect(b.add("value", { value: 0.25 }), avg.nodeId, "b");

    // AC beat: 1 + cos(mod(ts, 2π) · 2 + uv.y · 0.5) · 0.015 · wobble
    const tsMod = b.add("math", { op: "mod" }, { b: Math.PI * 2 });
    b.connect(ts, tsMod.nodeId, "a");
    const tsMod2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(tsMod, tsMod2.nodeId, "a");
    const uvY5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(uvY, uvY5.nodeId, "a");
    const acP = b.add("math", { op: "add" });
    b.connect(tsMod2, acP.nodeId, "a");
    b.connect(uvY5, acP.nodeId, "b");
    const acC = b.add("math", { op: "cos" });
    b.connect(acP, acC.nodeId, "x");
    const acS = b.add("math", { op: "mul" }, { b: 0.015 });
    b.connect(acC, acS.nodeId, "a");
    const acW = b.add("math", { op: "mul" });
    b.connect(acS, acW.nodeId, "a");
    b.connect(gi.wobble, acW.nodeId, "b");
    const acBeat = b.add("math", { op: "add" }, { a: 1 });
    b.connect(acW, acBeat.nodeId, "b");

    const beated = b.add("color-math", { op: "scale" });
    b.connect(avg, beated.nodeId, "a");
    b.connect(acBeat, beated.nodeId, "b");

    return b.output(beated, { nodeId: s2.nodeId, pin: "alpha" });
  }
}

register(Vhs);
export default Vhs;
