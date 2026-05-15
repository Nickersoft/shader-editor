// Glass — graph-decomposed. Simplex-noise gradient warps the sample UV;
// a small cross-blur softens the refracted lookup; mild RGB split adds
// chromatic edges; `tint` and `fresnel` colour-correct the result.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { GraphEffectBase } from "@/shaders/core/graph-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { PresetGraphBuilder } from "@/shaders/textures/preset-graphs/builders";

const meta: NodeMeta = {
  name: "Glass",
  description: "Frosted-glass refraction",
  color: "#22d3ee",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Glass extends GraphEffectBase {
  static readonly typeId = "glass";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static defaultGraph(): NodeGraph {
    const b = new PresetGraphBuilder();
    const gi = b.groupInput([
      { id: "refraction", type: "float", label: "Refraction", default: 0.5 },
      { id: "chromaticAberration", type: "float", label: "Chromatic Aberration", default: 0.3 },
      { id: "blur", type: "float", label: "Blur", default: 0.05 },
      { id: "tint", type: "vec3", label: "Tint", default: [1, 1, 1] },
      { id: "tintIntensity", type: "float", label: "Tint Intensity", default: 0.2 },
      { id: "fresnel", type: "float", label: "Fresnel", default: 0.3 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // q = uv · 8
    const q = b.add("vector-math", { op: "scale" });
    b.connect(uv, q.nodeId, "a");
    b.connect(b.add("value", { value: 8 }), q.nodeId, "b");

    const e = 0.01;
    // Three simplex samples to approximate the gradient: at q, q + (e, 0),
    // q + (0, e). Each via noise-texture/simplex (returns [0,1]) — the
    // gradient sign is preserved through the subtraction.
    const n0 = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(q, n0.nodeId, "p");

    const ex = b.add("combine-xy", {}, { y: 0 });
    b.connect(b.add("value", { value: e }), ex.nodeId, "x");
    const qx = b.add("vector-math", { op: "add" });
    b.connect(q, qx.nodeId, "a");
    b.connect(ex, qx.nodeId, "b");
    const nx = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(qx, nx.nodeId, "p");

    const ey = b.add("combine-xy", {}, { x: 0 });
    b.connect(b.add("value", { value: e }), ey.nodeId, "y");
    const qy = b.add("vector-math", { op: "add" });
    b.connect(q, qy.nodeId, "a");
    b.connect(ey, qy.nodeId, "b");
    const ny = b.add("noise-texture", {
      kind: "simplex", scale: 1, seed: 0, detail: 5,
      lacunarity: 2, roughness: 0.5, distortion: 0,
    });
    b.connect(qy, ny.nodeId, "p");

    // grad = ((nx − n0) / e, (ny − n0) / e)
    const dx = b.add("math", { op: "sub" });
    b.connect(nx, dx.nodeId, "a");
    b.connect(n0, dx.nodeId, "b");
    const gx = b.add("math", { op: "div" });
    b.connect(dx, gx.nodeId, "a");
    b.connect(b.add("value", { value: e }), gx.nodeId, "b");
    const dy = b.add("math", { op: "sub" });
    b.connect(ny, dy.nodeId, "a");
    b.connect(n0, dy.nodeId, "b");
    const gy = b.add("math", { op: "div" });
    b.connect(dy, gy.nodeId, "a");
    b.connect(b.add("value", { value: e }), gy.nodeId, "b");
    const grad = b.add("combine-xy", {});
    b.connect(gx, grad.nodeId, "x");
    b.connect(gy, grad.nodeId, "y");

    // refractedUV = uv + grad · refraction · 0.04
    const r004 = b.add("math", { op: "mul" }, { b: 0.04 });
    b.connect(gi.refraction, r004.nodeId, "a");
    const off = b.add("vector-math", { op: "scale" });
    b.connect(grad, off.nodeId, "a");
    b.connect(r004, off.nodeId, "b");
    const refUv = b.add("vector-math", { op: "add" });
    b.connect(uv, refUv.nodeId, "a");
    b.connect(off, refUv.nodeId, "b");

    // CA offset: caDir = normalize(grad + tiny) · ca · 0.015
    const eps = b.add("combine-xy", {});
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "x");
    b.connect(b.add("value", { value: 1e-5 }), eps.nodeId, "y");
    const gradEps = b.add("vector-math", { op: "add" });
    b.connect(grad, gradEps.nodeId, "a");
    b.connect(eps, gradEps.nodeId, "b");
    const caDir = b.add("vector-math", { op: "normalize" });
    b.connect(gradEps, caDir.nodeId, "a");
    const caStr = b.add("math", { op: "mul" }, { b: 0.015 });
    b.connect(gi.chromaticAberration, caStr.nodeId, "a");
    const caOff = b.add("vector-math", { op: "scale" });
    b.connect(caDir, caOff.nodeId, "a");
    b.connect(caStr, caOff.nodeId, "b");

    // Three samples with channel pick.
    const uvR = b.add("vector-math", { op: "add" });
    b.connect(refUv, uvR.nodeId, "a");
    b.connect(caOff, uvR.nodeId, "b");
    const sampleR = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvR, sampleR.nodeId, "uv");
    const sampleG = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(refUv, sampleG.nodeId, "uv");
    const uvB = b.add("vector-math", { op: "sub" });
    b.connect(refUv, uvB.nodeId, "a");
    b.connect(caOff, uvB.nodeId, "b");
    const sampleB = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(uvB, sampleB.nodeId, "uv");

    const sepR = b.add("separate-color", {});
    b.connect({ nodeId: sampleR.nodeId, pin: "color" }, sepR.nodeId, "v");
    const sepG = b.add("separate-color", {});
    b.connect({ nodeId: sampleG.nodeId, pin: "color" }, sepG.nodeId, "v");
    const sepB = b.add("separate-color", {});
    b.connect({ nodeId: sampleB.nodeId, pin: "color" }, sepB.nodeId, "v");
    const split = b.add("combine-color", {});
    b.connect({ nodeId: sepR.nodeId, pin: "r" }, split.nodeId, "r");
    b.connect({ nodeId: sepG.nodeId, pin: "g" }, split.nodeId, "g");
    b.connect({ nodeId: sepB.nodeId, pin: "b" }, split.nodeId, "b");

    // tinted = mix(split, split · tint, tintIntensity)
    const tinted = b.add("color-math", { op: "mul" });
    b.connect(split, tinted.nodeId, "a");
    b.connect(gi.tint, tinted.nodeId, "b");
    const mixT = b.add("mix-color", {});
    b.connect(split, mixT.nodeId, "a");
    b.connect(tinted, mixT.nodeId, "b");
    b.connect(gi.tintIntensity, mixT.nodeId, "t");

    // rim = clamp(length(grad) · 0.5, 0, 1)
    const gLen = b.add("vector-math", { op: "length" });
    b.connect(grad, gLen.nodeId, "a");
    const gLen5 = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(gLen, gLen5.nodeId, "a");
    const rim = b.add("math", { op: "min" }, { b: 1 });
    b.connect(gLen5, rim.nodeId, "a");

    // out = tinted + rim · fresnel  (rim is float; broadcast to vec3 via coerce)
    const rimF = b.add("math", { op: "mul" });
    b.connect(rim, rimF.nodeId, "a");
    b.connect(gi.fresnel, rimF.nodeId, "b");
    const out = b.add("color-math", { op: "addScalar" });
    b.connect(mixT, out.nodeId, "a");
    b.connect(rimF, out.nodeId, "b");

    return b.output(out, { nodeId: sampleG.nodeId, pin: "alpha" });
  }
}

register(Glass);
export default Glass;
