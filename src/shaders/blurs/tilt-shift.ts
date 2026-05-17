// TiltShift — graph-decomposed. Cross-blur gated by the perpendicular
// distance from a line through `(centerX, centerY)` at angle `angle`. Inside
// the `width` band the blur is off; outside, blur ramps up across `falloff`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // perp = vec2(-sin(a), cos(a))
    const aRad = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, aRad.nodeId, "x");
    const cosA = b.add("math", { op: "cos" });
    b.connect(aRad, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(aRad, sinA.nodeId, "x");
    const negSin = b.add("math", { op: "neg" });
    b.connect(sinA, negSin.nodeId, "x");
    const perp = b.add("combine-xy", {});
    b.connect(negSin, perp.nodeId, "x");
    b.connect(cosA, perp.nodeId, "y");

    // d = uv − centre
    const centre = b.add("combine-xy", {});
    b.connect(gi.centerX, centre.nodeId, "x");
    b.connect(gi.centerY, centre.nodeId, "y");
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(centre, d.nodeId, "b");

    // dist = abs(dot(d, perp))
    const dt = b.add("vector-math", { op: "dot" });
    b.connect(d, dt.nodeId, "a");
    b.connect(perp, dt.nodeId, "b");
    const dist = b.add("math", { op: "abs" });
    b.connect(dt, dist.nodeId, "x");

    // edge0 = width · 0.5; edge1 = edge0 + falloff
    const edge0 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gi.width, edge0.nodeId, "a");
    const edge1 = b.add("math", { op: "add" });
    b.connect(edge0, edge1.nodeId, "a");
    b.connect(gi.falloff, edge1.nodeId, "b");

    const t = b.add("smoothstep", {});
    b.connect(edge0, t.nodeId, "edge0");
    b.connect(edge1, t.nodeId, "edge1");
    b.connect(dist, t.nodeId, "x");

    const gated = b.add("math", { op: "mul" });
    b.connect(t, gated.nodeId, "a");
    b.connect(gi.intensity, gated.nodeId, "b");

    const h = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, h.nodeId, "uv");
    b.connect(gated, h.nodeId, "amount");
    b.connect(b.add("value", { value: 0 }), h.nodeId, "direction");
    const v = b.add("sampler", { mode: "linear", samples: 16, edges: "stretch" });
    b.connect(uv, v.nodeId, "uv");
    b.connect(gated, v.nodeId, "amount");
    b.connect(b.add("value", { value: 90 }), v.nodeId, "direction");
    const sum = b.add("color-math", { op: "add" });
    b.connect(h, sum.nodeId, "a");
    b.connect(v, sum.nodeId, "b");
    const avg = b.add("color-math", { op: "scale" });
    b.connect(sum, avg.nodeId, "a");
    b.connect(b.add("value", { value: 0.5 }), avg.nodeId, "b");

    const center = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv, center.nodeId, "uv");

    return b.output(avg, { nodeId: center.nodeId, pin: "alpha" });
  }
}

register(TiltShift);
export default TiltShift;
