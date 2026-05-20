import { ProceduralShader } from "@/shaders/core/procedural-shader.svelte";
import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { GraphBuilder, type NodeGraph } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Truchet",
  description: "Quarter-circle arc tiles",
  color: "#0ea5e9",
  category: "textures",
  defaultBlendMode: "normal",
};

// Decomposed Truchet — quarter-arc tiles. Per cell the hash picks one of two
// arc orientations (flip y on hash<0.5). The legacy `if` is decomposed via
// `mix + step`, which the GPU compiles to the same branchless code.
export class Truchet extends ProceduralShader {
  static readonly typeId = "truchet";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "scale", type: "float", label: "Scale", default: 10 },
      { id: "lineWidth", type: "float", label: "Line Width", default: 2 },
      { id: "seed", type: "float", label: "Seed", default: 0 },
    ]);
    const p = b.position();

    // scaled = p * scale
    const scaled = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(p).to(scaled, "a");
    b.connect(gi.scale).to(scaled, "b");

    // cell = floor(scaled); local = fract(scaled)
    const cell = b.add(new N.VectorMath({ op: "floor" }));
    b.connect(scaled).to(cell, "a");
    const local = b.add(new N.VectorMath({ op: "fract" }));
    b.connect(scaled).to(local, "a");

    // seed_v = vec2(seed, seed); h_input = cell + seed_v
    const seedV = b.add(new N.CombineXy());
    b.connect(gi.seed).to(seedV, "x");
    b.connect(gi.seed).to(seedV, "y");
    const hashIn = b.add(new N.VectorMath({ op: "add" }));
    b.connect(cell).to(hashIn, "a");
    b.connect(seedV).to(hashIn, "b");
    const hOut = b.add(new N.Hash());
    b.connect(hashIn).to(hOut, "p");

    // flip = step(h, 0.5)  → 1 if h < 0.5, else 0
    const flip = b.add(new N.Math({ op: "step" }), { b: 0.5 });
    b.connect(hOut).to(flip, "a");

    // local_flipped = mix(local, vec2(local.x, 1 - local.y), flip)
    const sep = b.add(new N.SeparateXy());
    b.connect(local).to(sep, "v");
    const localY = { nodeId: sep.nodeId, pin: "y" };
    const oneMinusY = b.add(new N.Math({ op: "oneminus" }));
    b.connect(localY).to(oneMinusY, "x");
    const flippedV = b.add(new N.CombineXy());
    b.connect(sep, "x").to(flippedV, "x");
    b.connect(oneMinusY).to(flippedV, "y");
    // Per-component mix via SeparateXY + Combine.mix isn't trivial (mix is
    // hardcoded at 0.5). Cheaper: build it as `local + flip * (flipped - local)`.
    const diff = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(flippedV).to(diff, "a");
    b.connect(local).to(diff, "b");
    const scaledDiff = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(diff).to(scaledDiff, "a");
    b.connect(flip).to(scaledDiff, "b");
    const localF = b.add(new N.VectorMath({ op: "add" }));
    b.connect(local).to(localF, "a");
    b.connect(scaledDiff).to(localF, "b");

    // d1 = abs(length(localF) - 0.5)
    const lenA = b.add(new N.VectorMath({ op: "length" }));
    b.connect(localF).to(lenA, "a");
    const dA = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(lenA).to(dA, "a");
    const d1 = b.add(new N.Math({ op: "abs" }));
    b.connect(dA).to(d1, "x");

    // d2 = abs(length(localF - vec2(1)) - 0.5)
    const oneV = b.add(new N.CombineXy(), { x: 1, y: 1 });
    const localFm1 = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(localF).to(localFm1, "a");
    b.connect(oneV).to(localFm1, "b");
    const lenB = b.add(new N.VectorMath({ op: "length" }));
    b.connect(localFm1).to(lenB, "a");
    const dB = b.add(new N.Math({ op: "sub" }), { b: 0.5 });
    b.connect(lenB).to(dB, "a");
    const d2 = b.add(new N.Math({ op: "abs" }));
    b.connect(dB).to(d2, "x");

    // dd = min(d1, d2)
    const dd = b.add(new N.Math({ op: "min" }));
    b.connect(d1).to(dd, "a");
    b.connect(d2).to(dd, "b");

    // lw = lineWidth * 0.025; mask = 1 - smoothstep(lw - eps, lw + eps, dd)
    // Use a small fixed `eps` instead of fwidth so the falloff is uniform.
    const lw = b.add(new N.Math({ op: "mul" }), { b: 0.025 });
    b.connect(gi.lineWidth).to(lw, "a");
    const lwHi = b.add(new N.Math({ op: "add" }), { b: 0.01 });
    b.connect(lw).to(lwHi, "a");
    const lwLo = b.add(new N.Math({ op: "sub" }), { b: 0.01 });
    b.connect(lw).to(lwLo, "a");
    const ss = b.add(new N.Smoothstep());
    b.connect(lwLo).to(ss, "edge0");
    b.connect(lwHi).to(ss, "edge1");
    b.connect(dd).to(ss, "x");
    const mask = b.add(new N.Math({ op: "oneminus" }));
    b.connect(ss).to(mask, "x");

    const ramp = b.colorRamp(mask, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  }
}

register(Truchet);
export default Truchet;
