// ProgressiveBlur — graph-decomposed. Cross-blur (H+V samplers, averaged)
// gated by a smoothstep over the projected distance from `(centerX, centerY)`
// along the angle axis. Inside the falloff band the blur is off; past it,
// blur ramps up to `intensity`.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Progressive Blur",
  description: "Blur strength ramps along an axis",
  color: "#94a3b8",
  category: "blurs",
  defaultBlendMode: "normal",
};

export class ProgressiveBlur extends ProceduralEffect {
  static readonly typeId = "progressive-blur";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "angle", type: "float", label: "Angle (deg)", default: 90 },
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "falloff", type: "float", label: "Falloff", default: 0.5 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // dir = vec2(cos(a), sin(a))
    const aRad = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.angle).to(aRad, "x");
    const cosA = b.add(new N.Math({ op: "cos" }));
    b.connect(aRad).to(cosA, "x");
    const sinA = b.add(new N.Math({ op: "sin" }));
    b.connect(aRad).to(sinA, "x");
    const dir = b.add(new N.CombineXy());
    b.connect(cosA).to(dir, "x");
    b.connect(sinA).to(dir, "y");

    // d = uv − centre
    const centre = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(centre, "x");
    b.connect(gi.centerY).to(centre, "y");
    const d = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(d, "a");
    b.connect(centre).to(d, "b");

    // proj = max(0, dot(d, dir))
    const dt = b.add(new N.VectorMath({ op: "dot" }));
    b.connect(d).to(dt, "a");
    b.connect(dir).to(dt, "b");
    const proj = b.add(new N.Math({ op: "max" }), { b: 0 });
    b.connect(dt).to(proj, "a");

    // t = smoothstep(0, falloff, proj)
    const t = b.add(new N.Smoothstep(), { edge0: 0 });
    b.connect(gi.falloff).to(t, "edge1");
    b.connect(proj).to(t, "x");

    // gatedIntensity = t · intensity
    const gated = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(gated, "a");
    b.connect(gi.intensity).to(gated, "b");

    // Cross blur with gated amount
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

register(ProgressiveBlur);
export default ProgressiveBlur;
