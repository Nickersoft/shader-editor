import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

// Decomposed Truchet — quarter-arc tiles. Per cell the hash picks one of two
// arc orientations (flip y on hash<0.5). The legacy `if` is decomposed via
// `mix + step`, which the GPU compiles to the same branchless code.
export default {
  id: "truchet",
  name: "Truchet",
  description: "Quarter-circle arc tiles — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "scale", type: "float", label: "Scale", default: 10 },
      { id: "lineWidth", type: "float", label: "Line Width", default: 2 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);
    const p = b.position();

    // scaled = p * scale
    const scaled = b.add("vector-math", { op: "scale" });
    b.connect(p, scaled.nodeId, "a");
    b.connect(gi.scale, scaled.nodeId, "b");

    // cell = floor(scaled); local = fract(scaled)
    const cell = b.add("vector-math", { op: "floor" });
    b.connect(scaled, cell.nodeId, "a");
    const local = b.add("vector-math", { op: "fract" });
    b.connect(scaled, local.nodeId, "a");

    // seed_v = vec2(seed, seed); h_input = cell + seed_v
    const seedV = b.add("combine-xy", {});
    b.connect(gi.seed, seedV.nodeId, "x");
    b.connect(gi.seed, seedV.nodeId, "y");
    const hashIn = b.add("vector-math", { op: "add" });
    b.connect(cell, hashIn.nodeId, "a");
    b.connect(seedV, hashIn.nodeId, "b");
    const hOut = b.add("hash", {});
    b.connect(hashIn, hOut.nodeId, "p");

    // flip = step(h, 0.5)  → 1 if h < 0.5, else 0
    const half = b.add("const", { value: 0.5 });
    const flip = b.add("combine", { op: "step" });
    b.connect(hOut, flip.nodeId, "a");
    b.connect(half, flip.nodeId, "b");

    // local_flipped = mix(local, vec2(local.x, 1 - local.y), flip)
    const sep = b.add("separate-xy", {});
    b.connect(local, sep.nodeId, "v");
    const localY = { nodeId: sep.nodeId, pin: "y" };
    const oneMinusY = b.add("math", { op: "oneminus" });
    b.connect(localY, oneMinusY.nodeId, "x");
    const flippedV = b.add("combine-xy", {});
    b.connect({ nodeId: sep.nodeId, pin: "x" }, flippedV.nodeId, "x");
    b.connect(oneMinusY, flippedV.nodeId, "y");
    // Per-component mix via SeparateXY + Combine.mix isn't trivial (mix is
    // hardcoded at 0.5). Cheaper: build it as `local + flip * (flipped - local)`.
    const diff = b.add("vector-math", { op: "sub" });
    b.connect(flippedV, diff.nodeId, "a");
    b.connect(local, diff.nodeId, "b");
    const scaledDiff = b.add("vector-math", { op: "scale" });
    b.connect(diff, scaledDiff.nodeId, "a");
    b.connect(flip, scaledDiff.nodeId, "b");
    const localF = b.add("vector-math", { op: "add" });
    b.connect(local, localF.nodeId, "a");
    b.connect(scaledDiff, localF.nodeId, "b");

    // d1 = abs(length(localF) - 0.5)
    const lenA = b.add("vector-math", { op: "length" });
    b.connect(localF, lenA.nodeId, "a");
    const dA = b.add("combine", { op: "sub" });
    b.connect(lenA, dA.nodeId, "a");
    b.connect(half, dA.nodeId, "b");
    const d1 = b.add("math", { op: "abs" });
    b.connect(dA, d1.nodeId, "x");

    // d2 = abs(length(localF - vec2(1)) - 0.5)
    const k1 = b.add("const", { value: 1 });
    const oneV = b.add("combine-xy", {});
    b.connect(k1, oneV.nodeId, "x");
    b.connect(k1, oneV.nodeId, "y");
    const localFm1 = b.add("vector-math", { op: "sub" });
    b.connect(localF, localFm1.nodeId, "a");
    b.connect(oneV, localFm1.nodeId, "b");
    const lenB = b.add("vector-math", { op: "length" });
    b.connect(localFm1, lenB.nodeId, "a");
    const dB = b.add("combine", { op: "sub" });
    b.connect(lenB, dB.nodeId, "a");
    b.connect(half, dB.nodeId, "b");
    const d2 = b.add("math", { op: "abs" });
    b.connect(dB, d2.nodeId, "x");

    // dd = min(d1, d2)
    const dd = b.add("combine", { op: "min" });
    b.connect(d1, dd.nodeId, "a");
    b.connect(d2, dd.nodeId, "b");

    // lw = lineWidth * 0.025; mask = 1 - smoothstep(lw - eps, lw + eps, dd)
    // Use a small fixed `eps` instead of fwidth so the falloff is uniform.
    const k0025 = b.add("const", { value: 0.025 });
    const lw = b.add("combine", { op: "mul" });
    b.connect(gi.lineWidth, lw.nodeId, "a");
    b.connect(k0025, lw.nodeId, "b");
    const eps = b.add("const", { value: 0.01 });
    const lwHi = b.add("combine", { op: "add" });
    b.connect(lw, lwHi.nodeId, "a");
    b.connect(eps, lwHi.nodeId, "b");
    const lwLo = b.add("combine", { op: "sub" });
    b.connect(lw, lwLo.nodeId, "a");
    b.connect(eps, lwLo.nodeId, "b");
    const ss = b.add("smoothstep", {});
    b.connect(lwLo, ss.nodeId, "edge0");
    b.connect(lwHi, ss.nodeId, "edge1");
    b.connect(dd, ss.nodeId, "x");
    const mask = b.add("math", { op: "oneminus" });
    b.connect(ss, mask.nodeId, "x");

    const ramp = b.colorRamp(mask, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
