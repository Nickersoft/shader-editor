// DropShadow — graph-decomposed. Cross-blur of the previous pass at an
// offset, then composite the resulting alpha as a coloured shadow under
// the original. The `cutout` mode is dropped (the conditional alpha
// subtraction doesn't fit the linear graph); authors who need cutout can
// follow with an `invert`-style mask.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // offset = vec2(cos(a), sin(a)) · distance
    const aRad = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, aRad.nodeId, "x");
    const cosA = b.add("math", { op: "cos" });
    b.connect(aRad, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(aRad, sinA.nodeId, "x");
    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");
    const off = b.add("vector-math", { op: "scale" });
    b.connect(dir, off.nodeId, "a");
    b.connect(gi.distance, off.nodeId, "b");

    // Shadow UV = uv − offset
    const shadowUv = b.add("vector-math", { op: "sub" });
    b.connect(uv, shadowUv.nodeId, "a");
    b.connect(off, shadowUv.nodeId, "b");

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
      const dv = b.add("combine-xy", {}, { x: dx, y: dy });
      void dv;
      const offset = b.add("value", { value: 0 });
      void offset;
      const dv2 = b.add("combine-xy", {});
      b.connect(b.add("value", { value: dx }), dv2.nodeId, "x");
      b.connect(b.add("value", { value: dy }), dv2.nodeId, "y");
      const scaled = b.add("vector-math", { op: "scale" });
      b.connect(dv2, scaled.nodeId, "a");
      b.connect(gi.blur, scaled.nodeId, "b");
      const u = b.add("vector-math", { op: "add" });
      b.connect(shadowUv, u.nodeId, "a");
      b.connect(scaled, u.nodeId, "b");
      const s = b.add("sample-previous-pass", { edges: "transparent" });
      b.connect(u, s.nodeId, "uv");
      return { nodeId: s.nodeId, pin: "alpha" };
    };

    // Five-tap soft alpha estimate.
    const a0 = tap(0, 0);
    const a1 = tap(0.5, 0);
    const a2 = tap(-0.5, 0);
    const a3 = tap(0, 0.5);
    const a4 = tap(0, -0.5);
    const sum1 = b.add("math", { op: "add" });
    b.connect(a0, sum1.nodeId, "a");
    b.connect(a1, sum1.nodeId, "b");
    const sum2 = b.add("math", { op: "add" });
    b.connect(sum1, sum2.nodeId, "a");
    b.connect(a2, sum2.nodeId, "b");
    const sum3 = b.add("math", { op: "add" });
    b.connect(sum2, sum3.nodeId, "a");
    b.connect(a3, sum3.nodeId, "b");
    const sum4 = b.add("math", { op: "add" });
    b.connect(sum3, sum4.nodeId, "a");
    b.connect(a4, sum4.nodeId, "b");
    const shadowA = b.add("math", { op: "mul" }, { b: 0.2 });
    b.connect(sum4, shadowA.nodeId, "a");

    // Gated by opacity
    const sa = b.add("math", { op: "mul" });
    b.connect(shadowA, sa.nodeId, "a");
    b.connect(gi.opacity, sa.nodeId, "b");

    // Composite over the original frame:
    //   out.rgb = mix(shadow.rgb, src.rgb, src.a)
    //   out.a   = src.a + shadow.a · (1 − src.a)
    const src = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(uv, src.nodeId, "uv");

    const rgb = b.add("mix-color", {});
    b.connect(gi.color, rgb.nodeId, "a");
    b.connect({ nodeId: src.nodeId, pin: "color" }, rgb.nodeId, "b");
    b.connect({ nodeId: src.nodeId, pin: "alpha" }, rgb.nodeId, "t");

    // shadowAOut = src.a + shadowA · (1 − src.a)
    const inv = b.add("math", { op: "oneminus" });
    b.connect({ nodeId: src.nodeId, pin: "alpha" }, inv.nodeId, "x");
    const sb = b.add("math", { op: "mul" });
    b.connect(sa, sb.nodeId, "a");
    b.connect(inv, sb.nodeId, "b");
    const aOut = b.add("math", { op: "add" });
    b.connect({ nodeId: src.nodeId, pin: "alpha" }, aOut.nodeId, "a");
    b.connect(sb, aOut.nodeId, "b");

    return b.output(rgb, aOut);
  }
}

register(DropShadow);
export default DropShadow;
