// Spherize — graph-decomposed. Inside the sphere disc, the sample UV is
// pulled toward the centre by `sin(asin(r/R) · depth)`, and a directional
// lighting term tints the result. The legacy effect blanks the warp
// outside the disc; the graph form lets the warp continue smoothly (the
// asin / sin chain rolls off naturally when r > R because asin clamps).

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Spherize",
  description: "Sphere lens distortion with directional light",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class Spherize extends ProceduralEffect {
  static readonly typeId = "spherize";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "radius", type: "float", label: "Radius", default: 0.5 },
      { id: "depth", type: "float", label: "Depth", default: 1 },
      { id: "lightAngle", type: "float", label: "Light Angle", default: 45 },
      { id: "lightIntensity", type: "float", label: "Light Intensity", default: 0.5 },
      { id: "lightSoftness", type: "float", label: "Light Softness", default: 0.5 },
      { id: "lightColor", type: "vec3", label: "Light Color", default: [1, 1, 1] },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    const centre = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(centre, "x");
    b.connect(gi.centerY).to(centre, "y");

    // p = uv − centre
    const p = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(p, "a");
    b.connect(centre).to(p, "b");
    const r = b.add(new N.VectorMath({ op: "length" }));
    b.connect(p).to(r, "a");

    // t = r / radius  (clamped via asin below)
    const tRaw = b.add(new N.Math({ op: "div" }));
    b.connect(r).to(tRaw, "a");
    b.connect(gi.radius).to(tRaw, "b");

    // theta = asin(clamp(t, 0, 1))  (math.arcsine clamps internally)
    const theta = b.add(new N.Math({ op: "arcsine" }));
    b.connect(tRaw).to(theta, "x");
    // newR = sin(theta · depth) · radius
    const td = b.add(new N.Math({ op: "mul" }));
    b.connect(theta).to(td, "a");
    b.connect(gi.depth).to(td, "b");
    const sinTd = b.add(new N.Math({ op: "sin" }));
    b.connect(td).to(sinTd, "x");
    const newR = b.add(new N.Math({ op: "mul" }));
    b.connect(sinTd).to(newR, "a");
    b.connect(gi.radius).to(newR, "b");

    // dir = normalize(p)
    const dir = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(p).to(dir, "a");
    // newP = dir · newR; finalUV = centre + newP
    const newP = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(dir).to(newP, "a");
    b.connect(newR).to(newP, "b");
    const finalUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(centre).to(finalUv, "a");
    b.connect(newP).to(finalUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
    b.connect(finalUv).to(sample, "uv");

    // Lighting: build a vec3 normal = normalize((p.x, p.y, sqrt(max(1−t²,0)) · R))
    // and a vec3 light dir = normalize((cos(la), sin(la), 0.5)), then
    // ndl = max(dot, 0); light = pow(ndl, 1/softness) · intensity.
    const t2 = b.add(new N.Math({ op: "mul" }));
    b.connect(tRaw).to(t2, "a");
    b.connect(tRaw).to(t2, "b");
    const t2c = b.add(new N.Math({ op: "oneminus" }));
    b.connect(t2).to(t2c, "x");
    const t2cm = b.add(new N.Math({ op: "max" }), { b: 0 });
    b.connect(t2c).to(t2cm, "a");
    const t2s = b.add(new N.Math({ op: "sqrt" }));
    b.connect(t2cm).to(t2s, "x");
    const nz = b.add(new N.Math({ op: "mul" }));
    b.connect(t2s).to(nz, "a");
    b.connect(gi.radius).to(nz, "b");
    const sepP = b.add(new N.SeparateXy());
    b.connect(p).to(sepP, "v");
    const normalV = b.add(new N.CombineColor());
    b.connect(sepP, "x").to(normalV, "r");
    b.connect(sepP, "y").to(normalV, "g");
    b.connect(nz).to(normalV, "b");
    const n = b.add(new N.VectorMath({ op: "normalize", dim: "vec3" }));
    b.connect(normalV).to(n, "a");

    const la = b.add(new N.Math({ op: "to-radians" }));
    b.connect(gi.lightAngle).to(la, "x");
    const cosL = b.add(new N.Math({ op: "cos" }));
    b.connect(la).to(cosL, "x");
    const sinL = b.add(new N.Math({ op: "sin" }));
    b.connect(la).to(sinL, "x");
    const L = b.add(new N.CombineColor());
    b.connect(cosL).to(L, "r");
    b.connect(sinL).to(L, "g");
    b.connect(b.add(new N.Const({ value: 0.5 }))).to(L, "b");
    const Ln = b.add(new N.VectorMath({ op: "normalize", dim: "vec3" }));
    b.connect(L).to(Ln, "a");

    const ndl = b.add(new N.VectorMath({ op: "dot", dim: "vec3" }));
    b.connect(n).to(ndl, "a");
    b.connect(Ln).to(ndl, "b");
    const ndlMax = b.add(new N.Math({ op: "max" }), { b: 0 });
    b.connect(ndl).to(ndlMax, "a");
    const invSoft = b.add(new N.Math({ op: "div" }), { a: 1 });
    b.connect(gi.lightSoftness).to(invSoft, "b");
    const litPow = b.add(new N.Math({ op: "pow" }));
    b.connect(ndlMax).to(litPow, "a");
    b.connect(invSoft).to(litPow, "b");
    const light = b.add(new N.Math({ op: "mul" }));
    b.connect(litPow).to(light, "a");
    b.connect(gi.lightIntensity).to(light, "b");

    // out = mix(sample.rgb, lightColor, clamp(light, 0, 1))
    const out = b.add(new N.MixColor());
    b.connect(sample, "color").to(out, "a");
    b.connect(gi.lightColor).to(out, "b");
    b.connect(light).to(out, "t");

    return b.output(out, { nodeId: sample.nodeId, pin: "alpha" });
  }
}

register(Spherize);
export default Spherize;
