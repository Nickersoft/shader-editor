// Glass — Apple Liquid Glass-style backdrop refraction, applied as a SHAPE
// effect. The host shape layer's own alpha mask defines where the glass
// material lives; the effect refracts whatever sits beneath this layer in
// the scene (sampled via `u_backdrop`, which the runtime composites from
// every lower layer + the scene background before this pass runs).
//
// Pipeline:
//   1. Sample u_prevPass.alpha at the centre + four cardinal neighbours.
//      Finite differences give a 2D gradient that points INTO the shape
//      from outside; its negation is the outward surface normal, and the
//      gradient magnitude doubles as an edge-proximity weight.
//   2. Build a refraction vector with `refract(0, normal·falloff, 1/ior)`
//      — the bergice/liquidglass move that pulls the backdrop strongest
//      where the gradient is strong, fading toward the interior.
//   3. Sample u_backdrop at uv + refraction*strength.
//   4. Mix in a thin inner-edge glow and modulate the final alpha by the
//      shape's own mask.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
  name: "Glass",
  description: "Liquid-glass refraction of what sits beneath the shape",
  color: "#22d3ee",
  category: "shape-effects",
  defaultBlendMode: "normal",
};

// UV-space epsilon for the alpha finite-difference. Small enough to track
// reasonably tight corners, large enough that the gradient survives the
// shape's anti-alias band.
const SDF_EPSILON = 0.003;

export class Glass extends ProceduralEffect {
  static readonly typeId = "glass";
  static readonly meta = meta;
  static readonly appliesTo = ["shape"] as const;
  static readonly needsBackdrop = true;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "refraction", type: "float", label: "Refraction", default: 1 },
      { id: "ior", type: "float", label: "IOR", default: 1.5 },
      { id: "glow", type: "float", label: "Edge Glow", default: 0.5 },
      { id: "thickness", type: "float", label: "Edge Thickness", default: 0.04 },
      { id: "alpha", type: "float", label: "Alpha", default: 0.9 },
    ]);

    const uv = b.add(new N.ScreenUV(), undefined, "uv");

    // Sample u_prevPass.alpha at `uv + offset`. Returns a handle pointing at
    // the sample node's alpha output.
    const sampleAlphaAt = (offX: number, offY: number) => {
      const off = b.add(new N.CombineXy(), { x: offX, y: offY });
      const sampleUV = b.add(new N.VectorMath({ op: "add" }));
      b.connect(uv).to(sampleUV, "a");
      b.connect(off).to(sampleUV, "b");
      const s = b.add(new N.SamplePreviousPass({ edges: "stretch" }));
      b.connect(sampleUV).to(s, "uv");
      return { nodeId: s.nodeId, pin: "alpha" };
    };
    const aC = sampleAlphaAt(0, 0);
    const aR = sampleAlphaAt(SDF_EPSILON, 0);
    const aL = sampleAlphaAt(-SDF_EPSILON, 0);
    const aT = sampleAlphaAt(0, SDF_EPSILON);
    const aBd = sampleAlphaAt(0, -SDF_EPSILON);

    // gradient = (aR - aL, aT - aB). Points INTO the shape — alpha rises
    // as we move from the outside (alpha = 0) into the interior (alpha = 1).
    const dx = b.add(new N.Math({ op: "sub" }));
    b.connect(aR).to(dx, "a");
    b.connect(aL).to(dx, "b");
    const dy = b.add(new N.Math({ op: "sub" }));
    b.connect(aT).to(dy, "a");
    b.connect(aBd).to(dy, "b");
    const gradient = b.add(new N.CombineXy());
    b.connect(dx).to(gradient, "x");
    b.connect(dy).to(gradient, "y");

    // outward normal = -normalize(gradient + ε). The ε keeps normalize sane
    // when we're deep inside the shape and the gradient collapses to zero.
    const tiny = b.add(new N.CombineXy(), { x: 1e-5, y: 1e-5 });
    const gradientEps = b.add(new N.VectorMath({ op: "add" }));
    b.connect(gradient).to(gradientEps, "a");
    b.connect(tiny).to(gradientEps, "b");
    const inwardN = b.add(new N.VectorMath({ op: "normalize" }));
    b.connect(gradientEps).to(inwardN, "a");
    const normal = b.add(new N.VectorMath({ op: "neg" }));
    b.connect(inwardN).to(normal, "a");

    // Pseudo-signed-distance: 0.5 − alpha. Negative deep inside (alpha → 1),
    // positive outside (alpha → 0), ≈ 0 at the antialias band.
    const dist = b.add(new N.Math({ op: "sub" }), { a: 0.5 });
    b.connect(aC).to(dist, "b");

    // gradLen ∈ [0,1]ish — magnitude of the alpha gradient. Used as an
    // edge-proximity falloff: peaks at the boundary, fades toward the
    // interior + exterior.
    const gradLen = b.add(new N.VectorMath({ op: "length" }));
    b.connect(gradient).to(gradLen, "a");

    // contour = clamp(gradLen / thickness, 0, 1).
    const contourRaw = b.add(new N.Math({ op: "div" }));
    b.connect(gradLen).to(contourRaw, "a");
    b.connect(gi.thickness).to(contourRaw, "b");
    const contourMin1 = b.add(new N.Math({ op: "min" }), { b: 1 });
    b.connect(contourRaw).to(contourMin1, "a");
    const contour = b.add(new N.Math({ op: "max" }), { b: 0 });
    b.connect(contourMin1).to(contour, "a");

    // eta = 1 / ior
    const eta = b.add(new N.Math({ op: "div" }), { a: 1 });
    b.connect(gi.ior).to(eta, "b");

    // Refraction normal scaled by contour^1.5 so the refraction is razor-thin
    // at the edge and effectively zero in the interior.
    const contourPow = b.add(new N.Math({ op: "pow" }), { b: 1.5 });
    b.connect(contour).to(contourPow, "a");
    const scaledN = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(normal).to(scaledN, "a");
    b.connect(contourPow).to(scaledN, "b");

    // refract(I=0, N=scaledN, η=1/ior). Incident-zero matches the reference
    // shader's `refract(vec2(0.0), N, eta)` move.
    const refrVec = b.add(new N.VectorMath({ op: "refract" }));
    b.connect(scaledN).to(refrVec, "b");
    b.connect(eta).to(refrVec, "c");

    // Refraction strength: user refraction × 0.35 × contour. 0.35 is the
    // same scalar the reference shader uses for its contour term.
    const refrK1 = b.add(new N.Math({ op: "mul" }), { b: 0.35 });
    b.connect(gi.refraction).to(refrK1, "a");
    const refrK = b.add(new N.Math({ op: "mul" }));
    b.connect(refrK1).to(refrK, "a");
    b.connect(contour).to(refrK, "b");
    const refrOffset = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(refrVec).to(refrOffset, "a");
    b.connect(refrK).to(refrOffset, "b");

    const refractUV = b.add(new N.VectorMath({ op: "add" }));
    b.connect(uv).to(refractUV, "a");
    b.connect(refrOffset).to(refractUV, "b");

    // Sample the backdrop (the composite of every layer below this one).
    const backdrop = b.add(new N.SampleBackdrop());
    b.connect(refractUV).to(backdrop, "uv");
    const backdropColor = { nodeId: backdrop.nodeId, pin: "color" };

    // Inner edge glow — a thin bright band just inside the shape boundary.
    //   edge = 1 − smoothstep(0, 0.03, dist · −2)
    const distNeg2 = b.add(new N.Math({ op: "mul" }), { b: -2 });
    b.connect(dist).to(distNeg2, "a");
    const glowBand = b.add(new N.Smoothstep(), { edge0: 0, edge1: 0.03 });
    b.connect(distNeg2).to(glowBand, "x");
    const oneMinusGlow = b.add(new N.Math({ op: "oneminus" }));
    b.connect(glowBand).to(oneMinusGlow, "x");
    const glowAmt = b.add(new N.Math({ op: "mul" }));
    b.connect(oneMinusGlow).to(glowAmt, "a");
    b.connect(gi.glow).to(glowAmt, "b");

    const glowChan = b.add(new N.Const({ value: 0.85 }));
    const glowColor = b.add(new N.CombineColor());
    b.connect(glowChan).to(glowColor, "r");
    b.connect(glowChan).to(glowColor, "g");
    b.connect(glowChan).to(glowColor, "b");

    const out = b.add(new N.MixColor());
    b.connect(backdropColor).to(out, "a");
    b.connect(glowColor).to(out, "b");
    b.connect(glowAmt).to(out, "t");

    // Final alpha: the shape's own mask, modulated by the user's overall
    // alpha. Outside the shape (aC = 0) the effect is fully transparent.
    const finalAlpha = b.add(new N.Math({ op: "mul" }));
    b.connect(aC).to(finalAlpha, "a");
    b.connect(gi.alpha).to(finalAlpha, "b");

    return b.output(out, finalAlpha);
  }
}

register(Glass);
export default Glass;
