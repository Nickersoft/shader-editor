// PolarFlowField — graph-decomposed (radial-dilate mode). fbm noise in
// polar coordinates around `(centerX, centerY)` drives a radial factor
// that pulls UVs in/out around the centre. The legacy effect's
// seam-hiding crossfade and explicit time-loop are dropped here: the
// node graph uses the existing `loop` primitive's blended phases for
// seamless wrapping, and accepts a visible angular seam on the negative-x
// ray. Authors who need the original's invisible seam can keep the
// legacy code; this graph captures the practical look.

import { register } from "@/shaders/core/registry";
import type { NodeMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";

const meta: NodeMeta = {
  name: "Polar Flow Field",
  description:
    "Noise-driven UV warp sampled in polar coordinates around a center",
  color: "#22d3ee",
  category: "distortion",
  defaultBlendMode: "normal",
};

export class PolarFlowField extends ProceduralEffect {
  static readonly typeId = "polar-flow-field";
  static readonly meta = meta;

  static graph(): NodeGraph {
    const b = new GraphBuilder();
    const gi = b.groupInput([
      { id: "centerX", type: "float", label: "Center X", default: 0.5 },
      { id: "centerY", type: "float", label: "Center Y", default: 0.5 },
      { id: "intensity", type: "float", label: "Intensity", default: 0.5 },
      { id: "detail", type: "float", label: "Detail", default: 1.5 },
      { id: "evolutionSpeed", type: "float", label: "Evolution Speed", default: 0.3 },
      { id: "loopDuration", type: "float", label: "Loop Duration", default: 0 },
    ]);

    const uv = b.add("screen-uv", {}, undefined, "uv");
    const t = b.add("time", {}, undefined, "out");

    // tLin = t · evolutionSpeed; loop primitive emits two offset phases
    // and a crossfade. We sample fbm at each phase and mix.
    const tLin = b.add("math", { op: "mul" });
    b.connect(t, tLin.nodeId, "a");
    b.connect(gi.evolutionSpeed, tLin.nodeId, "b");
    const loop = b.add("loop", {});
    b.connect(tLin, loop.nodeId, "t");
    b.connect(gi.loopDuration, loop.nodeId, "period");
    const phaseA = { nodeId: loop.nodeId, pin: "phase-a" };
    const phaseB = { nodeId: loop.nodeId, pin: "phase-b" };
    const blendMix = { nodeId: loop.nodeId, pin: "mix" };

    // Polar p − centre, then ang = atan2(p.y, p.x); L = length(p)
    const centre = b.add("combine-xy", {});
    b.connect(gi.centerX, centre.nodeId, "x");
    b.connect(gi.centerY, centre.nodeId, "y");
    const p = b.add("vector-math", { op: "sub" });
    b.connect(uv, p.nodeId, "a");
    b.connect(centre, p.nodeId, "b");
    const sepP = b.add("separate-xy", {});
    b.connect(p, sepP.nodeId, "v");
    const ang = b.add("math", { op: "atan2" });
    b.connect({ nodeId: sepP.nodeId, pin: "y" }, ang.nodeId, "a");
    b.connect({ nodeId: sepP.nodeId, pin: "x" }, ang.nodeId, "b");
    const L = b.add("vector-math", { op: "length" });
    b.connect(p, L.nodeId, "a");

    // Build polar sample point: vec2(ang, phase − inversesqrt(max(L, 1e-4)))
    // scaled by `detail`.
    const Lsafe = b.add("math", { op: "max" }, { b: 1e-4 });
    b.connect(L, Lsafe.nodeId, "a");
    const Linv = b.add("math", { op: "inverse-sqrt" });
    b.connect(Lsafe, Linv.nodeId, "x");
    // also subtract 0.5·L for the swirling-into-centre feel:
    const halfL = b.add("math", { op: "mul" }, { b: 0.5 });
    b.connect(L, halfL.nodeId, "a");
    const radialOff = b.add("math", { op: "sub" });
    b.connect(halfL, radialOff.nodeId, "a");
    b.connect(Linv, radialOff.nodeId, "b");

    const polarSample = (phase: { nodeId: string; pin: string }) => {
      const ph = b.add("math", { op: "sub" });
      b.connect(phase, ph.nodeId, "a");
      b.connect(radialOff, ph.nodeId, "b");
      const v = b.add("combine-xy", {});
      b.connect(ang, v.nodeId, "x");
      b.connect(ph, v.nodeId, "y");
      const scaled = b.add("vector-math", { op: "scale" });
      b.connect(v, scaled.nodeId, "a");
      b.connect(gi.detail, scaled.nodeId, "b");
      const n = b.add("noise-texture", {
        kind: "fbm", scale: 1, seed: 0, detail: 4,
        lacunarity: 2, roughness: 0.5, distortion: 0,
      });
      b.connect(scaled, n.nodeId, "p");
      return n;
    };

    const nA = polarSample(phaseA);
    const nB = polarSample(phaseB);
    const n01 = b.add("math", { op: "mix" });
    b.connect(nA, n01.nodeId, "a");
    b.connect(nB, n01.nodeId, "b");
    b.connect(blendMix, n01.nodeId, "c");

    // factor = mix(1, 0.8 + 1.2 · n01, intensity)
    const np = b.add("math", { op: "mul" }, { b: 1.2 });
    b.connect(n01, np.nodeId, "a");
    const npBase = b.add("math", { op: "add" }, { b: 0.8 });
    b.connect(np, npBase.nodeId, "a");
    const factor = b.add("math", { op: "mix" }, { a: 1 });
    b.connect(npBase, factor.nodeId, "b");
    b.connect(gi.intensity, factor.nodeId, "c");

    // q = uv − centre; warpedUV = centre + q · factor
    const q = b.add("vector-math", { op: "sub" });
    b.connect(uv, q.nodeId, "a");
    b.connect(centre, q.nodeId, "b");
    const qFactor = b.add("vector-math", { op: "scale" });
    b.connect(q, qFactor.nodeId, "a");
    b.connect(factor, qFactor.nodeId, "b");
    const warpedUv = b.add("vector-math", { op: "add" });
    b.connect(centre, warpedUv.nodeId, "a");
    b.connect(qFactor, warpedUv.nodeId, "b");

    const sample = b.add("sample-previous-pass", { edges: "transparent" });
    b.connect(warpedUv, sample.nodeId, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(PolarFlowField);
export default PolarFlowField;
