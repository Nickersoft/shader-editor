// Glitch — graph-decomposed. Band-based hash drives horizontal UV jitter;
// a sin(uv.y · 800 + t) scanline wave modulates it; mirror & colour-bar
// modes drop because they branch on `if` per fragment, which doesn't
// translate to a continuous-mix graph. The "core" jitter+scanline look is
// what the migration captures.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Glitch",
  description: "Banded jitter with scanline distortion",
  color: "#22d3ee",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class Glitch extends ProceduralEffect {
  static readonly typeId = "glitch";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.04 },
      { id: "speed", type: "float", label: "Speed", default: 6 },
      { id: "blockDensity", type: "float", label: "Block Density", default: 0.5 },
      { id: "scanlineDistortion", type: "float", label: "Scanline Distortion", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // lines = mix(8, 400, blockDensity)
    const lines = b.add("math", { op: "mix" }, { a: 8, b: 400 });
    b.connect(gi.blockDensity, lines.nodeId, "c");

    // band = floor(uv.y · lines)
    const sepUv = b.add("separate-xy", {});
    b.connect(uv, sepUv.nodeId, "v");
    const yl = b.add("math", { op: "mul" });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, yl.nodeId, "a");
    b.connect(lines, yl.nodeId, "b");
    const band = b.add("math", { op: "floor" });
    b.connect(yl, band.nodeId, "x");

    // ts = floor(t · speed)
    const tsRaw = b.add("math", { op: "mul" });
    b.connect(t, tsRaw.nodeId, "a");
    b.connect(gi.speed, tsRaw.nodeId, "b");
    const ts = b.add("math", { op: "floor" });
    b.connect(tsRaw, ts.nodeId, "x");

    // h = hash(vec2(band, ts))
    const bv = b.add("combine-xy", {});
    b.connect(band, bv.nodeId, "x");
    b.connect(ts, bv.nodeId, "y");
    const h = b.add("white-noise-texture", {});
    b.connect(bv, h.nodeId, "p");

    // jitter = (h − 0.5) · 2 · intensity
    const h5 = b.add("math", { op: "sub" }, { b: 0.5 });
    b.connect(h, h5.nodeId, "a");
    const h2 = b.add("math", { op: "mul" }, { b: 2 });
    b.connect(h5, h2.nodeId, "a");
    const jitter = b.add("math", { op: "mul" });
    b.connect(h2, jitter.nodeId, "a");
    b.connect(gi.intensity, jitter.nodeId, "b");

    // scanWave = sin(uv.y · 800 + t · speed · 4)
    const y800 = b.add("math", { op: "mul" }, { b: 800 });
    b.connect({ nodeId: sepUv.nodeId, pin: "y" }, y800.nodeId, "a");
    const ts4 = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(tsRaw, ts4.nodeId, "a");
    const swp = b.add("math", { op: "add" });
    b.connect(y800, swp.nodeId, "a");
    b.connect(ts4, swp.nodeId, "b");
    const scan = b.add("math", { op: "sin" });
    b.connect(swp, scan.nodeId, "x");
    const scan01 = b.add("math", { op: "mul" }, { b: 0.01 });
    b.connect(scan, scan01.nodeId, "a");
    const scanX = b.add("math", { op: "mul" });
    b.connect(scan01, scanX.nodeId, "a");
    b.connect(gi.scanlineDistortion, scanX.nodeId, "b");

    // totalX = jitter + scanX
    const totalX = b.add("math", { op: "add" });
    b.connect(jitter, totalX.nodeId, "a");
    b.connect(scanX, totalX.nodeId, "b");

    // q = uv + vec2(totalX, 0)
    const offV = b.add("combine-xy", {}, { y: 0 });
    b.connect(totalX, offV.nodeId, "x");
    const q = b.add("vector-math", { op: "add" });
    b.connect(uv, q.nodeId, "a");
    b.connect(offV, q.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(q, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Glitch);
export default Glitch;
