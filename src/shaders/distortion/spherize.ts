// Spherize — graph-decomposed. Inside the sphere disc, the sample UV is
// pulled toward the centre by `sin(asin(r/R) · depth)`, and a directional
// lighting term tints the result. The legacy effect blanks the warp
// outside the disc; the graph form lets the warp continue smoothly (the
// asin / sin chain rolls off naturally when r > R because asin clamps).

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
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

    const uv = b.add("screen-uv", {}, undefined, "uv");

    const centre = b.add("combine-xy", {});
    b.connect(gi.centerX, centre.nodeId, "x");
    b.connect(gi.centerY, centre.nodeId, "y");

    // p = uv − centre
    const p = b.add("vector-math", { op: "sub" });
    b.connect(uv, p.nodeId, "a");
    b.connect(centre, p.nodeId, "b");
    const r = b.add("vector-math", { op: "length" });
    b.connect(p, r.nodeId, "a");

    // t = r / radius  (clamped via asin below)
    const tRaw = b.add("math", { op: "div" });
    b.connect(r, tRaw.nodeId, "a");
    b.connect(gi.radius, tRaw.nodeId, "b");

    // theta = asin(clamp(t, 0, 1))  (math.arcsine clamps internally)
    const theta = b.add("math", { op: "arcsine" });
    b.connect(tRaw, theta.nodeId, "x");
    // newR = sin(theta · depth) · radius
    const td = b.add("math", { op: "mul" });
    b.connect(theta, td.nodeId, "a");
    b.connect(gi.depth, td.nodeId, "b");
    const sinTd = b.add("math", { op: "sin" });
    b.connect(td, sinTd.nodeId, "x");
    const newR = b.add("math", { op: "mul" });
    b.connect(sinTd, newR.nodeId, "a");
    b.connect(gi.radius, newR.nodeId, "b");

    // dir = normalize(p)
    const dir = b.add("vector-math", { op: "normalize" });
    b.connect(p, dir.nodeId, "a");
    // newP = dir · newR; finalUV = centre + newP
    const newP = b.add("vector-math", { op: "scale" });
    b.connect(dir, newP.nodeId, "a");
    b.connect(newR, newP.nodeId, "b");
    const finalUv = b.add("vector-math", { op: "add" });
    b.connect(centre, finalUv.nodeId, "a");
    b.connect(newP, finalUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(finalUv, sample.nodeId, "uv");

    // Lighting: build a vec3 normal = normalize((p.x, p.y, sqrt(max(1−t²,0)) · R))
    // and a vec3 light dir = normalize((cos(la), sin(la), 0.5)), then
    // ndl = max(dot, 0); light = pow(ndl, 1/softness) · intensity.
    const t2 = b.add("math", { op: "mul" });
    b.connect(tRaw, t2.nodeId, "a");
    b.connect(tRaw, t2.nodeId, "b");
    const t2c = b.add("math", { op: "oneminus" });
    b.connect(t2, t2c.nodeId, "x");
    const t2cm = b.add("math", { op: "max" }, { b: 0 });
    b.connect(t2c, t2cm.nodeId, "a");
    const t2s = b.add("math", { op: "sqrt" });
    b.connect(t2cm, t2s.nodeId, "x");
    const nz = b.add("math", { op: "mul" });
    b.connect(t2s, nz.nodeId, "a");
    b.connect(gi.radius, nz.nodeId, "b");
    const sepP = b.add("separate-xy", {});
    b.connect(p, sepP.nodeId, "v");
    const normalV = b.add("combine-color", {});
    b.connect({ nodeId: sepP.nodeId, pin: "x" }, normalV.nodeId, "r");
    b.connect({ nodeId: sepP.nodeId, pin: "y" }, normalV.nodeId, "g");
    b.connect(nz, normalV.nodeId, "b");
    const n = b.add("vector-math", { op: "normalize", dim: "vec3" });
    b.connect(normalV, n.nodeId, "a");

    const la = b.add("math", { op: "to-radians" });
    b.connect(gi.lightAngle, la.nodeId, "x");
    const cosL = b.add("math", { op: "cos" });
    b.connect(la, cosL.nodeId, "x");
    const sinL = b.add("math", { op: "sin" });
    b.connect(la, sinL.nodeId, "x");
    const L = b.add("combine-color", {});
    b.connect(cosL, L.nodeId, "r");
    b.connect(sinL, L.nodeId, "g");
    b.connect(b.add("value", { value: 0.5 }), L.nodeId, "b");
    const Ln = b.add("vector-math", { op: "normalize", dim: "vec3" });
    b.connect(L, Ln.nodeId, "a");

    const ndl = b.add("vector-math", { op: "dot", dim: "vec3" });
    b.connect(n, ndl.nodeId, "a");
    b.connect(Ln, ndl.nodeId, "b");
    const ndlMax = b.add("math", { op: "max" }, { b: 0 });
    b.connect(ndl, ndlMax.nodeId, "a");
    const invSoft = b.add("math", { op: "div" }, { a: 1 });
    b.connect(gi.lightSoftness, invSoft.nodeId, "b");
    const litPow = b.add("math", { op: "pow" });
    b.connect(ndlMax, litPow.nodeId, "a");
    b.connect(invSoft, litPow.nodeId, "b");
    const light = b.add("math", { op: "mul" });
    b.connect(litPow, light.nodeId, "a");
    b.connect(gi.lightIntensity, light.nodeId, "b");

    // out = mix(sample.rgb, lightColor, clamp(light, 0, 1))
    const out = b.add("mix-color", {});
    b.connect({ nodeId: sample.nodeId, pin: "color" }, out.nodeId, "a");
    b.connect(gi.lightColor, out.nodeId, "b");
    b.connect(light, out.nodeId, "t");

    return b.output(out, { nodeId: sample.nodeId, pin: "alpha" });
  }
}

register(Spherize);
export default Spherize;
