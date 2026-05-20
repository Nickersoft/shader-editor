// PolarFlowField — graph-decomposed (radial-dilate mode). fbm noise in
// polar coordinates around `(centerX, centerY)` drives a radial factor
// that pulls UVs in/out around the centre. The legacy effect's
// seam-hiding crossfade and explicit time-loop are dropped here: the
// node graph uses the existing `loop` primitive's blended phases for
// seamless wrapping, and accepts a visible angular seam on the negative-x
// ray. Authors who need the original's invisible seam can keep the
// legacy code; this graph captures the practical look.

import { register } from "@/shaders/core/registry";
import type { ShaderMeta } from "@/shaders/core/types";
import { ProceduralEffect } from "@/shaders/core/procedural-effect.svelte";
import type { NodeGraph } from "@/shaders/node-graph";
import { GraphBuilder } from "@/shaders/node-graph";
import * as N from "@/shaders/node-graph/nodes";

const meta: ShaderMeta = {
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

    const uv = b.add(new N.ScreenUV(), undefined, "uv");
    const t = b.add(new N.Time(), undefined, "out");

    // tLin = t · evolutionSpeed; loop primitive emits two offset phases
    // and a crossfade. We sample fbm at each phase and mix.
    const tLin = b.add(new N.Math({ op: "mul" }));
    b.connect(t).to(tLin, "a");
    b.connect(gi.evolutionSpeed).to(tLin, "b");
    const loop = b.add(new N.Loop());
    b.connect(tLin).to(loop, "t");
    b.connect(gi.loopDuration).to(loop, "period");
    const phaseA = { nodeId: loop.nodeId, pin: "phase-a" };
    const phaseB = { nodeId: loop.nodeId, pin: "phase-b" };
    const blendMix = { nodeId: loop.nodeId, pin: "mix" };

    // Polar p − centre, then ang = atan2(p.y, p.x); L = length(p)
    const centre = b.add(new N.CombineXy());
    b.connect(gi.centerX).to(centre, "x");
    b.connect(gi.centerY).to(centre, "y");
    const p = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(p, "a");
    b.connect(centre).to(p, "b");
    const sepP = b.add(new N.SeparateXy());
    b.connect(p).to(sepP, "v");
    const ang = b.add(new N.Math({ op: "atan2" }));
    b.connect(sepP, "y").to(ang, "a");
    b.connect(sepP, "x").to(ang, "b");
    const L = b.add(new N.VectorMath({ op: "length" }));
    b.connect(p).to(L, "a");

    // Build polar sample point: vec2(ang, phase − inversesqrt(max(L, 1e-4)))
    // scaled by `detail`.
    const Lsafe = b.add(new N.Math({ op: "max" }), { b: 1e-4 });
    b.connect(L).to(Lsafe, "a");
    const Linv = b.add(new N.Math({ op: "inverse-sqrt" }));
    b.connect(Lsafe).to(Linv, "x");
    // also subtract 0.5·L for the swirling-into-centre feel:
    const halfL = b.add(new N.Math({ op: "mul" }), { b: 0.5 });
    b.connect(L).to(halfL, "a");
    const radialOff = b.add(new N.Math({ op: "sub" }));
    b.connect(halfL).to(radialOff, "a");
    b.connect(Linv).to(radialOff, "b");

    const polarSample = (phase: { nodeId: string; pin: string }) => {
      const ph = b.add(new N.Math({ op: "sub" }));
      b.connect(phase).to(ph, "a");
      b.connect(radialOff).to(ph, "b");
      const v = b.add(new N.CombineXy());
      b.connect(ang).to(v, "x");
      b.connect(ph).to(v, "y");
      const scaled = b.add(new N.VectorMath({ op: "scale" }));
      b.connect(v).to(scaled, "a");
      b.connect(gi.detail).to(scaled, "b");
      const n = b.add(new N.NoiseTexture({
        kind: "fbm", scale: 1, seed: 0, detail: 4,
        lacunarity: 2, roughness: 0.5, distortion: 0,
      }));
      b.connect(scaled).to(n, "p");
      return n;
    };

    const nA = polarSample(phaseA);
    const nB = polarSample(phaseB);
    const n01 = b.add(new N.Math({ op: "mix" }));
    b.connect(nA).to(n01, "a");
    b.connect(nB).to(n01, "b");
    b.connect(blendMix).to(n01, "c");

    // factor = mix(1, 0.8 + 1.2 · n01, intensity)
    const np = b.add(new N.Math({ op: "mul" }), { b: 1.2 });
    b.connect(n01).to(np, "a");
    const npBase = b.add(new N.Math({ op: "add" }), { b: 0.8 });
    b.connect(np).to(npBase, "a");
    const factor = b.add(new N.Math({ op: "mix" }), { a: 1 });
    b.connect(npBase).to(factor, "b");
    b.connect(gi.intensity).to(factor, "c");

    // q = uv − centre; warpedUV = centre + q · factor
    const q = b.add(new N.VectorMath({ op: "sub" }));
    b.connect(uv).to(q, "a");
    b.connect(centre).to(q, "b");
    const qFactor = b.add(new N.VectorMath({ op: "scale" }));
    b.connect(q).to(qFactor, "a");
    b.connect(factor).to(qFactor, "b");
    const warpedUv = b.add(new N.VectorMath({ op: "add" }));
    b.connect(centre).to(warpedUv, "a");
    b.connect(qFactor).to(warpedUv, "b");

    const sample = b.add(new N.SamplePreviousPass({ edges: "transparent" }));
    b.connect(warpedUv).to(sample, "uv");

    return b.output(
      { nodeId: sample.nodeId, pin: "color" },
      { nodeId: sample.nodeId, pin: "alpha" },
    );
  }
}

register(PolarFlowField);
export default PolarFlowField;
