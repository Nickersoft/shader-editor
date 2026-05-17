// Neon — graph-decomposed. Edge map from |Δluma| at four neighbour taps,
// plus a cross-blur of the previous pass; both lightly tinted and summed.
// Flicker is sin-of-time scaled by the `flicker` knob.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder, type PrevRef } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // Tap luma at uv ± 0.001 in X and Y, take |l1 − l2| in each axis.
    const lumaAt = (dx: number, dy: number): PrevRef => {
      const dv = b.add("combine-xy", {});
      b.connect(b.add("value", { value: dx }), dv.nodeId, "x");
      b.connect(b.add("value", { value: dy }), dv.nodeId, "y");
      const u = b.add("vector-math", { op: "add" });
      b.connect(uv, u.nodeId, "a");
      b.connect(dv, u.nodeId, "b");
      const s = b.add("sample-previous-pass", { edges: "stretch" });
      b.connect(u, s.nodeId, "uv");
      const l = b.add("color-math", { op: "luminance" });
      b.connect({ nodeId: s.nodeId, pin: "color" }, l.nodeId, "a");
      return l;
    };

    const lX1 = lumaAt(0.002, 0);
    const lX2 = lumaAt(-0.002, 0);
    const lY1 = lumaAt(0, 0.002);
    const lY2 = lumaAt(0, -0.002);

    const dX = b.add("math", { op: "sub" });
    b.connect(lX1, dX.nodeId, "a");
    b.connect(lX2, dX.nodeId, "b");
    const aX = b.add("math", { op: "abs" });
    b.connect(dX, aX.nodeId, "x");
    const dY = b.add("math", { op: "sub" });
    b.connect(lY1, dY.nodeId, "a");
    b.connect(lY2, dY.nodeId, "b");
    const aY = b.add("math", { op: "abs" });
    b.connect(dY, aY.nodeId, "x");
    const edge = b.add("math", { op: "add" });
    b.connect(aX, edge.nodeId, "a");
    b.connect(aY, edge.nodeId, "b");

    // Cross-blurred sample for the halo.
    const h = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, h.nodeId, "uv");
    b.connect(gi.glowSize, h.nodeId, "amount");
    b.connect(b.add("value", { value: 0 }), h.nodeId, "direction");
    const v = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, v.nodeId, "uv");
    b.connect(gi.glowSize, v.nodeId, "amount");
    b.connect(b.add("value", { value: 90 }), v.nodeId, "direction");
    const sum = b.add("color-math", { op: "add" });
    b.connect(h, sum.nodeId, "a");
    b.connect(v, sum.nodeId, "b");
    const blurred = b.add("color-math", { op: "scale" });
    b.connect(sum, blurred.nodeId, "a");
    b.connect(b.add("value", { value: 0.5 }), blurred.nodeId, "b");
    const blurLuma = b.add("color-math", { op: "luminance" });
    b.connect(blurred, blurLuma.nodeId, "a");

    // flick = 1 − flicker · (0.5 + 0.5 · sin(t · 20))
    const t20 = b.add("math", { op: "mul" }, { b: 20 });
    b.connect(t, t20.nodeId, "a");
    const s = b.add("math", { op: "sin" });
    b.connect(t20, s.nodeId, "x");
    const s5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(s, s5.nodeId, "a");
    const wave = b.add("math", { op: "add" }, { b: 0.5 });
    b.connect(s5, wave.nodeId, "a");
    const fmul = b.add("math", { op: "mul" });
    b.connect(gi.flicker, fmul.nodeId, "a");
    b.connect(wave, fmul.nodeId, "b");
    const flick = b.add("math", { op: "oneminus" });
    b.connect(fmul, flick.nodeId, "x");

    // core = coreColor · edge · 4
    const e4 = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(edge, e4.nodeId, "a");
    const core = b.add("color-math", { op: "scale" });
    b.connect(gi.coreColor, core.nodeId, "a");
    b.connect(e4, core.nodeId, "b");

    // halo = glowColor · blurLuma · 1.5
    const bl15 = b.add("math", { op: "mul" }, { b: 1.5 });
    b.connect(blurLuma, bl15.nodeId, "a");
    const halo = b.add("color-math", { op: "scale" });
    b.connect(gi.glowColor, halo.nodeId, "a");
    b.connect(bl15, halo.nodeId, "b");

    // out = (core + halo) · glowIntensity · flick
    const ch = b.add("color-math", { op: "add" });
    b.connect(core, ch.nodeId, "a");
    b.connect(halo, ch.nodeId, "b");
    const iMul = b.add("math", { op: "mul" });
    b.connect(gi.glowIntensity, iMul.nodeId, "a");
    b.connect(flick, iMul.nodeId, "b");
    const out = b.add("color-math", { op: "scale" });
    b.connect(ch, out.nodeId, "a");
    b.connect(iMul, out.nodeId, "b");

    const one = b.add("value", { value: 1 });
    return b.output(out, one);
  }
}

register(Neon);
export default Neon;
