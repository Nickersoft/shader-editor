// Emboss — graph-decomposed. Two samples at uv ± dir compared via luminance,
// scaled into a grey-on-grey relief. `softness` widens the offset distance.
//
// Original effect samples ±dir·texel·reach, where reach=mix(1,4,softness).
// We push the texel-relative offset through the sampler by scaling the
// shared `amount` pin — sampler-linear is unsuited here because we want
// just two taps, not N. Build directly with sample-previous-pass.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Emboss",
  description: "Embossed relief",
  color: "#475569",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Emboss extends ProceduralEffect {
  static readonly typeId = "emboss";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "lightAngle", type: "float", label: "Light Angle", default: 45 },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "softness", type: "float", label: "Softness", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // dir = vec2(cos(a), sin(a)) * (1/u_resolution) * mix(1, 4, softness)
    // Skip the per-texel scaling by treating `softness` as a unit-UV offset
    // directly — the visual differs only in physical scale. Use a baked
    // scaling factor of 1/200 for a sensible default look.
    const a = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.lightAngle).to(a, "x");
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(a).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(a).to(sinA, "x");
    const dirUnit = b.add(new N.CombineXy());
    b.connect(cosA).to(dirUnit, "x");
    b.connect(sinA).to(dirUnit, "y");

    // reach = mix(0.005, 0.02, softness) in UV space
    const reach = b.add(new N.Math({ op: "mix" }), { a: 0.005, b: 0.02 });
    b.connect(gi.softness).to(reach, "c");

    const dir = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dirUnit).to(dir, "a");
    b.connect(reach).to(dir, "b");

    const uv1 = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(uv1, "a");
    b.connect(dir).to(uv1, "b");
    const s1 = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv1).to(s1, "uv");
    const l1 = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(s1, "color").to(l1, "a");

    const uv2 = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(uv2, "a");
    b.connect(dir).to(uv2, "b");
    const s2 = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv2).to(s2, "uv");
    const l2 = b.add(new N.ColorMath({ op: "luminance" }));
    b.connect(s2, "color").to(l2, "a");

    // v = (l1 − l2) · intensity · 4 + 0.5
    const diff = b.add(new N.Math({ op: "sub" }));
    b.connect(l1).to(diff, "a");
    b.connect(l2).to(diff, "b");
    const scaled = b.add(new N.Math({ op: "mul" }));
    b.connect(diff).to(scaled, "a");
    b.connect(gi.intensity).to(scaled, "b");
    const amped = b.add(new N.Math({ op: "mul" }), { b: 4 });
    b.connect(scaled).to(amped, "a");
    const v = b.add(new N.Math({ op: "add" }), { b: 0.5 });
    b.connect(amped).to(v, "a");

    const grey = b.add(new N.CombineColor());
    b.connect(v).to(grey, "r");
    b.connect(v).to(grey, "g");
    b.connect(v).to(grey, "b");

    const one = b.add(new N.Const({ value: 1 }));
    return b.output(grey, one);
  }
}

register(Emboss);
export default Emboss;
