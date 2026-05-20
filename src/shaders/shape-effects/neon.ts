// Neon — graph-decomposed. Edge map from |Δluma| at four neighbour taps,
// plus a cross-blur of the previous pass; both lightly tinted and summed.
// Flicker is sin-of-time scaled by the `flicker` knob.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type NodeHandle } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Neon",
  description: "Glowing-edges neon effect",
  color: "#facc15",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Neon extends ProceduralEffect {
  static readonly typeId = "neon";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "glowIntensity", type: "float", label: "Glow Intensity", default: 1 },
      { id: "glowSize", type: "float", label: "Glow Size", default: 0.05 },
      { id: "flicker", type: "float", label: "Flicker", default: 0 },
      { id: "coreColor", type: "vec3", label: "Core Color", default: [1, 1, 1] },
      { id: "glowColor", type: "vec3", label: "Glow Color", default: [1, 0.6, 0.2] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // Tap luma at uv ± 0.001 in X and Y, take |l1 − l2| in each axis.
    const lumaAt = (dx: number, dy: number): NodeHandle => {
      const dv = b.add(new N.CombineXy());
      b.connect(b.add(new N.Const({ value: dx }))).to(dv, "x");
      b.connect(b.add(new N.Const({ value: dy }))).to(dv, "y");
      const u = b.add(new N.VectorMath({ op: "add" }));
      b.connect(uv).to(u, "a");
      b.connect(dv).to(u, "b");
      const s = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
      b.connect(u).to(s, "uv");
      const l = b.add(new N.ColorMath({ op: "luminance" }));
      b.connect(s, "color").to(l, "a");
      return l;
    };

    const lX1 = lumaAt(0.002, 0);
    const lX2 = lumaAt(-0.002, 0);
    const lY1 = lumaAt(0, 0.002);
    const lY2 = lumaAt(0, -0.002);

    const dX = b.add(new N.Math({ op: "sub" }));
    b.connect(lX1).to(dX, "a");
    b.connect(lX2).to(dX, "b");
    const aX = b.add(new N.Math({ op: "abs" }));
    b.connect(dX).to(aX, "x");
    const dY = b.add(new N.Math({ op: "sub" }));
    b.connect(lY1).to(dY, "a");
    b.connect(lY2).to(dY, "b");
    const aY = b.add(new N.Math({ op: "abs" }));
    b.connect(dY).to(aY, "x");
    const edge = b.add(new N.Math({ op: "add" }));
    b.connect(aX).to(edge, "a");
    b.connect(aY).to(edge, "b");

    // Cross-blurred sample for the halo.
    const h = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(h, "uv");
    b.connect(gi.glowSize).to(h, "amount");
    b.connect(b.add(new N.Const({ value: 0 }))).to(h, "direction");
    const v = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(v, "uv");
    b.connect(gi.glowSize).to(v, "amount");
    b.connect(b.add(new N.Const({ value: 90 }))).to(v, "direction");
    const sum = b.add(new N.ColorMath({ op: "add" }));
    b.connect(h).to(sum, "a");
    b.connect(v).to(sum, "b");
    const blurred = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sum).to(blurred, "a");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(blurred, "b");
    const blurLuma = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(blurred).to(blurLuma, "a");

    // flick = 1 − flicker · (0.5 + 0.5 · sin(t · 20))
    const t20 = b.add(new N.Math({ op: "mul" }), { b: 20 });
    b.connect(t).to(t20, "a");
    const s = b.add(new N.Math({ op: "sin" }));
    b.connect(t20).to(s, "x");
    const s5 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(s).to(s5, "a");
    const wave = b.add(new N.Math({ op: "add" }), { b: 0.5 });
    b.connect(s5).to(wave, "a");
    const fmul = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.flicker).to(fmul, "a");
    b.connect(wave).to(fmul, "b");
    const flick = b.add(new N.Math({ op: "oneminus" }));
    b.connect(fmul).to(flick, "x");

    // core = coreColor · edge · 4
    const e4 = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(edge).to(e4, "a");
    const core = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(gi.coreColor).to(core, "a");
    b.connect(e4).to(core, "b");

    // halo = glowColor · blurLuma · 1.5
    const bl15 = b.add(new N.Math({ op: "mul" }), { b: 1.5 });
    b.connect(blurLuma).to(bl15, "a");
    const halo = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(gi.glowColor).to(halo, "a");
    b.connect(bl15).to(halo, "b");

    // out = (core + halo) · glowIntensity · flick
    const ch = b.add(new N.ColorMath({ op: "add" }));
    b.connect(core).to(ch, "a");
    b.connect(halo).to(ch, "b");
    const iMul = b.add(new N.Math({ op: "mul" }));
    b.connect(gi.glowIntensity).to(iMul, "a");
    b.connect(flick).to(iMul, "b");
    const out = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(ch).to(out, "a");
    b.connect(iMul).to(out, "b");

    const one = b.add(new N.Const({ value: 1 }));
    return b.output(out, one);
  }
}

register(Neon);
export default Neon;
