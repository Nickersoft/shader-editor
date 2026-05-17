// Emboss — graph-decomposed. Two samples at uv ± dir compared via luminance,
// scaled into a grey-on-grey relief. `softness` widens the offset distance.
//
// Original effect samples ±dir·texel·reach, where reach=mix(1,4,softness).
// We push the texel-relative offset through the sampler by scaling the
// shared `amount` pin — sampler-linear is unsuited here because we want
// just two taps, not N. Build directly with sample-previous-pass.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // dir = vec2(cos(a), sin(a)) * (1/u_resolution) * mix(1, 4, softness)
    // Skip the per-texel scaling by treating `softness` as a unit-UV offset
    // directly — the visual differs only in physical scale. Use a baked
    // scaling factor of 1/200 for a sensible default look.
    const a = b.add("math", { op: "to-radians" });
    b.connect(gi.lightAngle, a.nodeId, "x");
    const cosA = b.add("math", { op: "cos" });
    b.connect(a, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(a, sinA.nodeId, "x");
    const dirUnit = b.add("combine-xy", {});
    b.connect(cosA, dirUnit.nodeId, "x");
    b.connect(sinA, dirUnit.nodeId, "y");

    // reach = mix(0.005, 0.02, softness) in UV space
    const reach = b.add("math", { op: "mix" }, { a: 0.005, b: 0.02 });
    b.connect(gi.softness, reach.nodeId, "c");

    const dir = b.add("vector-math", { op: "scale" });
    b.connect(dirUnit, dir.nodeId, "a");
    b.connect(reach, dir.nodeId, "b");

    const uv1 = b.add("vector-math", { op: "add" });
    b.connect(uv, uv1.nodeId, "a");
    b.connect(dir, uv1.nodeId, "b");
    const s1 = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv1, s1.nodeId, "uv");
    const l1 = b.add("color-math", { op: "luminance" });
    b.connect({ nodeId: s1.nodeId, pin: "color" }, l1.nodeId, "a");

    const uv2 = b.add("vector-math", { op: "sub" });
    b.connect(uv, uv2.nodeId, "a");
    b.connect(dir, uv2.nodeId, "b");
    const s2 = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uv2, s2.nodeId, "uv");
    const l2 = b.add("color-math", { op: "luminance" });
    b.connect({ nodeId: s2.nodeId, pin: "color" }, l2.nodeId, "a");

    // v = (l1 − l2) · intensity · 4 + 0.5
    const diff = b.add("math", { op: "sub" });
    b.connect(l1, diff.nodeId, "a");
    b.connect(l2, diff.nodeId, "b");
    const scaled = b.add("math", { op: "mul" });
    b.connect(diff, scaled.nodeId, "a");
    b.connect(gi.intensity, scaled.nodeId, "b");
    const amped = b.add("math", { op: "mul" }, { b: 4 });
    b.connect(scaled, amped.nodeId, "a");
    const v = b.add("math", { op: "add" }, { b: 0.5 });
    b.connect(amped, v.nodeId, "a");

    const grey = b.add("combine-color", {});
    b.connect(v, grey.nodeId, "r");
    b.connect(v, grey.nodeId, "g");
    b.connect(v, grey.nodeId, "b");

    const one = b.add("value", { value: 1 });
    return b.output(grey, one);
  }
}

register(Emboss);
export default Emboss;
