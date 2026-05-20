// Glitch — graph-decomposed. Band-based hash drives horizontal UV jitter;
// a sin(uv.y · 800 + t) scanline wave modulates it; mirror & colour-bar
// modes drop because they branch on `if` per fragment, which doesn't
// translate to a continuous-mix graph. The "core" jitter+scanline look is
// what the migration captures.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // lines = mix(8, 400, blockDensity)
    const lines = b.add(new N.Math({ op: "mix" }), { a: 8, b: 400 });
    b.connect(gi.blockDensity).to(lines, "c");

    // band = floor(uv.y · lines)
    const sepUv = b.add(new N.SeparateXy());
    b.connect(uv).to(sepUv, "v");
    const yl = b.add(new N.Math({ op: "mul" }));
    b.connect(sepUv, "y").to(yl, "a");
    b.connect(lines).to(yl, "b");
    const band = b.add(new N.Math({ op: "floor" }));
    b.connect(yl).to(band, "x");

    // ts = floor(t · speed)
    const tsRaw = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(tsRaw, "a");
    b.connect(gi.speed).to(tsRaw, "b");
    const ts = b.add(new N.Math({ op: "floor" }));
    b.connect(tsRaw).to(ts, "x");

    // h = hash(vec2(band, ts))
    const bv = b.add(new N.CombineXy());
    b.connect(band).to(bv, "x");
    b.connect(ts).to(bv, "y");
    const h = b.add(new N.Hash());
    b.connect(bv).to(h, "p");

    // jitter = (h − 0.5) · 2 · intensity
    const h5 = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(h).to(h5, "a");
    const h2 = b.add(new N.Math({ op: "mul" }), { b: 2 });
    b.connect(h5).to(h2, "a");
    const jitter = b.add(new N.Math({ op: "mul" }));
    b.connect(h2).to(jitter, "a");
    b.connect(gi.intensity).to(jitter, "b");

    // scanWave = sin(uv.y · 800 + t · speed · 4)
    const y800 = b.add(new N.Math({ op: "mul" }), { b: 800 });
    b.connect(sepUv, "y").to(y800, "a");
    const ts4 = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(tsRaw).to(ts4, "a");
    const swp = b.add(new N.Math({ op: "add" }));
    b.connect(y800).to(swp, "a");
    b.connect(ts4).to(swp, "b");
    const scan = b.add(new N.Math({ op: "sin" }));
    b.connect(swp).to(scan, "x");
    const scan01 = b.add(new N.Math({ op: "mul" }), { b: 0.01 });
    b.connect(scan).to(scan01, "a");
    const scanX = b.add(new N.Math({ op: "mul" }));
    b.connect(scan01).to(scanX, "a");
    b.connect(gi.scanlineDistortion).to(scanX, "b");

    // totalX = jitter + scanX
    const totalX = b.add(new N.Math({ op: "add" }));
    b.connect(jitter).to(totalX, "a");
    b.connect(scanX).to(totalX, "b");

    // q = uv + vec2(totalX, 0)
    const offV = b.add(new N.CombineXy(), { y: 0 });
    b.connect(totalX).to(offV, "x");
    const q = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(q, "a");
    b.connect(offV).to(q, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(q).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(Glitch);
export default Glitch;
