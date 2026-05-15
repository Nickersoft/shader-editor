// ProgressiveBlur — graph-decomposed. Cross-blur (H+V samplers, averaged)
// gated by a smoothstep over the projected distance from `(centerX, centerY)`
// along the angle axis. Inside the falloff band the blur is off; past it,
// blur ramps up to `intensity`.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Progressive Blur",
  description: "Blur strength ramps along an axis",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class ProgressiveBlur extends GraphEffectBase {
  static readonly typeId = "progressive-blur";
  static readonly meta = meta;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 90 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.5 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // dir = vec2(cos(a), sin(a))
    const aRad = b.add("math", { op: "to-radians" });
    b.connect(gi.angle, aRad.nodeId, "x");
    const cosA = b.add("math", { op: "cos" });
    b.connect(aRad, cosA.nodeId, "x");
    const sinA = b.add("math", { op: "sin" });
    b.connect(aRad, sinA.nodeId, "x");
    const dir = b.add("combine-xy", {});
    b.connect(cosA, dir.nodeId, "x");
    b.connect(sinA, dir.nodeId, "y");

    // d = uv − centre
    const centre = b.add("combine-xy", {});
    b.connect(gi.centerX, centre.nodeId, "x");
    b.connect(gi.centerY, centre.nodeId, "y");
    const d = b.add("vector-math", { op: "sub" });
    b.connect(uv, d.nodeId, "a");
    b.connect(centre, d.nodeId, "b");

    // proj = max(0, dot(d, dir))
    const dt = b.add("vector-math", { op: "dot" });
    b.connect(d, dt.nodeId, "a");
    b.connect(dir, dt.nodeId, "b");
    const proj = b.add("math", { op: "max" }, { b: 0 });
    b.connect(dt, proj.nodeId, "a");

    // t = smoothstep(0, falloff, proj)
    const t = b.add("smoothstep", {}, { edge0: 0 });
    b.connect(gi.falloff, t.nodeId, "edge1");
    b.connect(proj, t.nodeId, "x");

    // gatedIntensity = t · intensity
    const gated = b.add("math", { op: "mul" });
    b.connect(t, gated.nodeId, "a");
    b.connect(gi.intensity, gated.nodeId, "b");

    // Cross blur with gated amount
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

register(ProgressiveBlur);
export default ProgressiveBlur;
