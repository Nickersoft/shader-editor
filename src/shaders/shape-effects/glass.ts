// Glass — graph-decomposed port of the bergice/liquidglass shader. Within a
// rounded-box region (center/size/radius), the previous pass is refracted
// through an SDF-derived normal at the edges, with a dome-style radial
// refraction biasing the centre. The refracted lookup is mixed with a small
// Gaussian-blurred sample to produce the frosted feel, and a soft rim glow
// is overlaid at the inner edge. Alpha tapers from `alpha` inside the shape
// to 0 outside so the effect composites cleanly over whatever layer sits
// beneath it.
//
// Built on the `rounded-box` (signed-distance + normal in one node) and
// `sampler` (Gaussian mode) primitives — both authored alongside this port.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Glass",
  description: "Liquid-glass refraction (rounded-box SDF + frosted blur + rim glow)",
  color: "#22d3ee",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

export class Glass extends ProceduralEffect {
  static readonly typeId = "glass";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "center", type: "vec2", label: "Center", default: [0.5, 0.5] },
      { id: "size", type: "vec2", label: "Size", default: [0.15, 0.06] },
      { id: "radius", type: "float", label: "Corner Radius", default: 0.025 },
      { id: "refraction", type: "float", label: "Refraction", default: 1 },
      { id: "ior", type: "float", label: "IOR", default: 1.5 },
      { id: "domeSize", type: "float", label: "Dome Size", default: 0.15 },
      { id: "blur", type: "float", label: "Blur Mix", default: 0.5 },
      { id: "glow", type: "float", label: "Edge Glow", default: 0.5 },
      { id: "alpha", type: "float", label: "Alpha", default: 1 },
      { id: "edgeSoftness", type: "float", label: "Edge Softness", default: 0.005 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");

    // Rounded-box SDF — distance + outward normal in a single node.
    const sdf = b.add("sdf", { shape: "rounded-box" }, { eps: 0.002 });
    b.connect(uv, sdf.nodeId, "uv");
    b.connect(gi.center, sdf.nodeId, "center");
    b.connect(gi.size, sdf.nodeId, "size");
    b.connect(gi.radius, sdf.nodeId, "radius");
    const dist = { nodeId: sdf.nodeId, pin: "distance" };
    const normal = { nodeId: sdf.nodeId, pin: "normal" };

    // eta = 1 / ior  (Snell's ratio for entering the glass).
    const one = b.add("value", { value: 1 });
    const eta = b.add("math", { op: "div" });
    b.connect(one, eta.nodeId, "a");
    b.connect(gi.ior, eta.nodeId, "b");

    // delta = uv − center; r = clamp(length(delta) / domeSize, 0, 1).
    const delta = b.add("vector-math", { op: "sub" });
    b.connect(uv, delta.nodeId, "a");
    b.connect(gi.center, delta.nodeId, "b");
    const dir = b.add("vector-math", { op: "normalize" });
    b.connect(delta, dir.nodeId, "a");
    const dLen = b.add("vector-math", { op: "length" });
    b.connect(delta, dLen.nodeId, "a");
    const rRaw = b.add("math", { op: "div" });
    b.connect(dLen, rRaw.nodeId, "a");
    b.connect(gi.domeSize, rRaw.nodeId, "b");
    const r = b.add("math", { op: "min" }, { b: 1 });
    b.connect(rRaw, r.nodeId, "a");

    // Dome refraction: incident = −(dir · r); refract through dome normal
    // (also dir · r). Offset the UV by the refracted vector scaled by 0.03
    // and the user's refraction strength.
    const domeN = b.add("vector-math", { op: "scale" });
    b.connect(dir, domeN.nodeId, "a");
    b.connect(r, domeN.nodeId, "b");
    const incident = b.add("vector-math", { op: "neg" });
    b.connect(domeN, incident.nodeId, "a");
    const refrDome = b.add("vector-math", { op: "refract" });
    b.connect(incident, refrDome.nodeId, "a");
    b.connect(domeN, refrDome.nodeId, "b");
    b.connect(eta, refrDome.nodeId, "c");
    const domeScale = b.add("math", { op: "mul" }, { b: 0.03 });
    b.connect(gi.refraction, domeScale.nodeId, "a");
    const domeOff = b.add("vector-math", { op: "scale" });
    b.connect(refrDome, domeOff.nodeId, "a");
    b.connect(domeScale, domeOff.nodeId, "b");
    const curvedUV = b.add("vector-math", { op: "add" });
    b.connect(uv, curvedUV.nodeId, "a");
    b.connect(domeOff, curvedUV.nodeId, "b");

    // Edge-contour refraction: scale the SDF normal by an edge falloff so the
    // refraction concentrates near the boundary, then refract a zero incident
    // through it (matches the reference shader's `refract(vec2(0.0), N, eta)`).
    const absDist = b.add("math", { op: "abs" });
    b.connect(dist, absDist.nodeId, "x");
    const negAbsDist = b.add("math", { op: "mul" }, { b: -0.4 });
    b.connect(absDist, negAbsDist.nodeId, "a");
    const contourFalloff = b.add("math", { op: "exp" });
    b.connect(negAbsDist, contourFalloff.nodeId, "x");
    const contourFallPow = b.add("math", { op: "pow" }, { b: 1.5 });
    b.connect(contourFalloff, contourFallPow.nodeId, "a");
    const contourN = b.add("vector-math", { op: "scale" });
    b.connect(normal, contourN.nodeId, "a");
    b.connect(contourFallPow, contourN.nodeId, "b");
    // refract default `a` is (0, 0); leave it unconnected.
    const refrContour = b.add("vector-math", { op: "refract" });
    b.connect(contourN, refrContour.nodeId, "b");
    b.connect(eta, refrContour.nodeId, "c");
    const contourScaleA = b.add("math", { op: "mul" }, { b: 0.35 });
    b.connect(gi.refraction, contourScaleA.nodeId, "a");
    const contourScaleB = b.add("math", { op: "mul" });
    b.connect(contourScaleA, contourScaleB.nodeId, "a");
    b.connect(contourFalloff, contourScaleB.nodeId, "b");
    const contourOff = b.add("vector-math", { op: "scale" });
    b.connect(refrContour, contourOff.nodeId, "a");
    b.connect(contourScaleB, contourOff.nodeId, "b");
    const contourUV = b.add("vector-math", { op: "add" });
    b.connect(uv, contourUV.nodeId, "a");
    b.connect(contourOff, contourUV.nodeId, "b");

    // Combined weight: smoothstep(0, 1, |dist|) − 0.5 · smoothstep(0.5, 1, r),
    // clamped to [0, 1]. Near the edge, contour refraction dominates; deep
    // inside (large r), dome refraction wins.
    const edgeW = b.add("smoothstep", {}, { edge0: 0, edge1: 1 });
    b.connect(absDist, edgeW.nodeId, "x");
    const radialW = b.add("smoothstep", {}, { edge0: 0.5, edge1: 1 });
    b.connect(r, radialW.nodeId, "x");
    const halfRadialW = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(radialW, halfRadialW.nodeId, "a");
    const weightRaw = b.add("math", { op: "sub" });
    b.connect(edgeW, weightRaw.nodeId, "a");
    b.connect(halfRadialW, weightRaw.nodeId, "b");
    const weightLo = b.add("math", { op: "max" }, { b: 0 });
    b.connect(weightRaw, weightLo.nodeId, "a");
    const weight = b.add("math", { op: "min" }, { b: 1 });
    b.connect(weightLo, weight.nodeId, "a");

    // refractUV = curvedUV + (contourUV − curvedUV) · weight.
    const uvDiff = b.add("vector-math", { op: "sub" });
    b.connect(contourUV, uvDiff.nodeId, "a");
    b.connect(curvedUV, uvDiff.nodeId, "b");
    const uvBlend = b.add("vector-math", { op: "scale" });
    b.connect(uvDiff, uvBlend.nodeId, "a");
    b.connect(weight, uvBlend.nodeId, "b");
    const refractUV = b.add("vector-math", { op: "add" });
    b.connect(curvedUV, refractUV.nodeId, "a");
    b.connect(uvBlend, refractUV.nodeId, "b");

    // Sharp + Gaussian-blurred lookups of the previous pass, mixed by `blur`.
    const sharp = b.add("sample-previous-pass", { edges: "stretch" });
    b.connect(refractUV, sharp.nodeId, "uv");
    const blurred = b.add("sampler", {
      mode: "gaussian",
      samples: 3,
      edges: "stretch",
    });
    b.connect(refractUV, blurred.nodeId, "uv");
    // `amount` controls texel stride — 2 matches the reference shader.
    const blurAmount = b.add("value", { value: 2 });
    b.connect(blurAmount, blurred.nodeId, "amount");
    const base = b.add("mix-color", {});
    b.connect({ nodeId: sharp.nodeId, pin: "color" }, base.nodeId, "a");
    b.connect(blurred, base.nodeId, "b");
    b.connect(gi.blur, base.nodeId, "t");

    // Edge glow: 1 − smoothstep(0, 0.03, dist · −2). Reaches 1 in a thin band
    // just inside the boundary; 0 deep inside and outside the shape.
    const distNeg2 = b.add("math", { op: "mul" }, { b: -2 });
    b.connect(dist, distNeg2.nodeId, "a");
    const glowBand = b.add("smoothstep", {}, { edge0: 0, edge1: 0.03 });
    b.connect(distNeg2, glowBand.nodeId, "x");
    const oneMinusGlow = b.add("math", { op: "sub" });
    b.connect(one, oneMinusGlow.nodeId, "a");
    b.connect(glowBand, oneMinusGlow.nodeId, "b");
    const glowAmt = b.add("math", { op: "mul" });
    b.connect(oneMinusGlow, glowAmt.nodeId, "a");
    b.connect(gi.glow, glowAmt.nodeId, "b");
    const glowColor = b.add("value", { value: 0.7 });
    const glowVec = b.add("combine-color", {});
    b.connect(glowColor, glowVec.nodeId, "r");
    b.connect(glowColor, glowVec.nodeId, "g");
    b.connect(glowColor, glowVec.nodeId, "b");
    const out = b.add("mix-color", {});
    b.connect(base, out.nodeId, "a");
    b.connect(glowVec, out.nodeId, "b");
    b.connect(glowAmt, out.nodeId, "t");

    // Alpha: full inside the shape, smoothly fading to 0 across `edgeSoftness`
    // outside the boundary. Multiplied by the user's overall alpha.
    const shapeMask = b.add("smoothstep", {}, { edge0: 0 });
    b.connect(dist, shapeMask.nodeId, "x");
    b.connect(gi.edgeSoftness, shapeMask.nodeId, "edge1");
    const insideMask = b.add("math", { op: "sub" });
    b.connect(one, insideMask.nodeId, "a");
    b.connect(shapeMask, insideMask.nodeId, "b");
    const finalAlpha = b.add("math", { op: "mul" });
    b.connect(insideMask, finalAlpha.nodeId, "a");
    b.connect(gi.alpha, finalAlpha.nodeId, "b");

    return b.output(out, finalAlpha);
  }
}

register(Glass);
export default Glass;
