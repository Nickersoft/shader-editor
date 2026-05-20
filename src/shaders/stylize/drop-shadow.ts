// DropShadow — graph-decomposed. Cross-blur of the previous pass at an
// offset, then composite the resulting alpha as a coloured shadow under
// the original. The `cutout` mode is dropped (the conditional alpha
// subtraction doesn't fit the linear graph); authors who need cutout can
// follow with an `invert`-style mask.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Drop Shadow",
  description: "Soft shadow behind opaque content",
  color: "#1e293b",
  category: "stylize",
  defaultBlendMode: "normal",
};

export class DropShadow extends ProceduralEffect {
  static readonly typeId = "drop-shadow";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "angle", type: "float", label: "Angle (deg)", default: 135 },
      { id: "distance", type: "float", label: "Distance", default: 0.05 },
      { id: "blur", type: "float", label: "Blur", default: 0.1 },
      { id: "color", type: "vec3", label: "Shadow Color", default: [0, 0, 0] },
      { id: "opacity", type: "float", label: "Opacity", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // offset = vec2(cos(a), sin(a)) · distance
    const aRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(aRad, "x");
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(aRad).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(aRad).to(sinA, "x");
    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");
    const off = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(off, "a");
    b.connect(gi.distance).to(off, "b");

    // Shadow UV = uv − offset
    const shadowUv = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(shadowUv, "a");
    b.connect(off).to(shadowUv, "b");

    // Cross-blurred shadow alpha — sample H and V independently then average
    // the resulting (color, alpha) pairs. We only care about alpha here, but
    // the sampler returns RGB; pull alpha by sampling u_prevPass directly at
    // the blurred UVs. Approximate by sampling at offset and using a small
    // softening pass: do a single kernel-3x3 sampler whose kernel is a
    // 3×3 Gaussian, then take its alpha proxy via luminance of the result.
    // Simpler approach: just take an averaged alpha over a few taps.
    // We use the sample-previous-pass alpha at four jittered UVs around the
    // shadow point and average — close enough to a real Gaussian for a soft
    // drop shadow.
    const tap = (dx: number, dy: number) => {
      const dv = b.add(new N.CombineXy(), { x: dx, y: dy });
      void dv;
      const offset = b.add(new N.Const({ value: 0 }));
      void offset;
      const dv2 = b.add(new N.CombineXy());
      b.connect(b.add(new N.Const({ value: dx }))).to(dv2, "x");
      b.connect(b.add(new N.Const({ value: dy }))).to(dv2, "y");
      const scaled = b.add(new N.VectorMath({ op: "scale" }));
      b.connect(dv2).to(scaled, "a");
      b.connect(gi.blur).to(scaled, "b");
      const u = b.add(new N.VectorMath({ op: "add" }));
      b.connect(shadowUv).to(u, "a");
      b.connect(scaled).to(u, "b");
      const s = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
      b.connect(u).to(s, "uv");
      return { nodeId: s.nodeId, pin: "alpha" };
    };

    // Five-tap soft alpha estimate.
    const a0 = tap(0, 0);
    const a1 = tap(0.5, 0);
    const a2 = tap(-0.5, 0);
    const a3 = tap(0, 0.5);
    const a4 = tap(0, -0.5);
    const sum1 = b.add(new N.Math({ op: "add" }));
    b.connect(a0).to(sum1, "a");
    b.connect(a1).to(sum1, "b");
    const sum2 = b.add(new N.Math({ op: "add" }));
    b.connect(sum1).to(sum2, "a");
    b.connect(a2).to(sum2, "b");
    const sum3 = b.add(new N.Math({ op: "add" }));
    b.connect(sum2).to(sum3, "a");
    b.connect(a3).to(sum3, "b");
    const sum4 = b.add(new N.Math({ op: "add" }));
    b.connect(sum3).to(sum4, "a");
    b.connect(a4).to(sum4, "b");
    const shadowA = b.add(new N.Math({ op: "mul" }), { b: 0.2 });
    b.connect(sum4).to(shadowA, "a");

    // Gated by opacity
    const sa = b.add(new N.Math({ op: "mul" }));
    b.connect(shadowA).to(sa, "a");
    b.connect(gi.opacity).to(sa, "b");

    // Composite over the original frame:
    //   out.rgb = mix(shadow.rgb, src.rgb, src.a)
    //   out.a   = src.a + shadow.a · (1 − src.a)
    const src = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(uv).to(src, "uv");

    const rgb = b.add(new N.MixColor());
    b.connect(gi.color).to(rgb, "a");
    b.connect(src, "color").to(rgb, "b");
    b.connect(src, "alpha").to(rgb, "t");

    // shadowAOut = src.a + shadowA · (1 − src.a)
    const inv = b.add(new N.Math({ op: "oneminus" }));
    b.connect(src, "alpha").to(inv, "x");
    const sb = b.add(new N.Math({ op: "mul" }));
    b.connect(sa).to(sb, "a");
    b.connect(inv).to(sb, "b");
    const aOut = b.add(new N.Math({ op: "add" }));
    b.connect(src, "alpha").to(aOut, "a");
    b.connect(sb).to(aOut, "b");

    return b.output(rgb, aOut);
  }
}

register(DropShadow);
export default DropShadow;
