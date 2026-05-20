// TiltShift — graph-decomposed. Cross-blur gated by the perpendicular
// distance from a line through `(centerX, centerY)` at angle `angle`. Inside
// the `width` band the blur is off; outside, blur ramps up across `falloff`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Tilt Shift",
  description: "Selective focus band (tilt-shift miniature)",
  color: "#0ea5e9",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class TiltShift extends ProceduralEffect {
  static readonly typeId = "tilt-shift";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "width", type: "float", label: "Width", default: 0.3 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.3 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 0 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // perp = vec2(-sin(a), cos(a))
    const aRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(aRad, "x");
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(aRad).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(aRad).to(sinA, "x");
    const negSin = b.add(new N.Math({ op: "neg" }));
    b.connect(sinA).to(negSin, "x");
    const perp = b.add(new N.CombineXy());
    b.connect(negSin).to(perp, "x");
    b.connect(cosA).to(perp, "y");

    // d = uv − centre
    const centre = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(centre, "x");
    b.connect(gi.centerY).to(centre, "y");
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(centre).to(d, "b");

    // dist = abs(dot(d, perp))
    const dt = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(d).to(dt, "a");
    b.connect(perp).to(dt, "b");
    const dist = b.add(new N.Math({ op: "abs" }));
    b.connect(dt).to(dist, "x");

    // edge0 = width · 0.5; edge1 = edge0 + falloff
    const edge0 = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(gi.width).to(edge0, "a");
    const edge1 = b.add(new N.Math({ op: "add" }));
    b.connect(edge0).to(edge1, "a");
    b.connect(gi.falloff).to(edge1, "b");

    const t = b.add(new N.Smoothstep());
    b.connect(edge0).to(t, "edge0");
    b.connect(edge1).to(t, "edge1");
    b.connect(dist).to(t, "x");

    const gated = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(gated, "a");
    b.connect(gi.intensity).to(gated, "b");

    const h = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(h, "uv");
    b.connect(gated).to(h, "amount");
    b.connect(b.add(new N.Const({ value: 0 }))).to(h, "direction");
    const v = b.add(new N.Sampler({ mode: "linear", samples: 16, edges: "stretch" }));
    b.connect(uv).to(v, "uv");
    b.connect(gated).to(v, "amount");
    b.connect(b.add(new N.Const({ value: 90 }))).to(v, "direction");
    const sum = b.add(new N.ColorMath({ op: "add" }));
    b.connect(h).to(sum, "a");
    b.connect(v).to(sum, "b");
    const avg = b.add(new N.ColorMath({ op: "scale" }));
    b.connect(sum).to(avg, "a");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(avg, "b");

    const center = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(uv).to(center, "uv");

    return b.output(avg, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(TiltShift);
export default TiltShift;
