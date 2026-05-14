import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

// Phase-3 migration: the legacy preset used a `mix-fields` stage with
// `mode: multiply, factor: 0.7`. Decomposed here as `n = a * b` — the factor
// knob is gone in favour of a legible two-input multiply; the visual is
// essentially identical at factor=1, and tweakability lands in Phase 4.
export default {
  id: "branched-noise",
  name: "Branched Noise",
  description: "Mix Fields demo — multiplies a Noise field by a Voronoi field, then colorizes",
  color: "#f59e0b",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();

    const fbm = b.frame("Noise branch", "#0ea5e9", () => {
      const srcA = b.fieldTransform(p, t, { scale: 3, speed: 0.6, seed: 0 });
      const fbm = b.add("noise-texture", { kind: "fbm", detail: 4, lacunarity: 2, roughness: 0.5, distortion: 0 });
      b.connect(srcA.p, fbm.nodeId, "p");
      b.connect(srcA.t, fbm.nodeId, "t");
      return fbm;
    });

    const vor = b.frame("Voronoi branch", "#f59e0b", () => {
      const srcB = b.fieldTransform(p, t, { scale: 0.6, speed: 0.4, seed: 17 });
      const vor = b.add("voronoi-texture", { feature: "f1", metric: "euclidean", randomness: 0.9, smoothness: 0.4 });
      b.connect(srcB.p, vor.nodeId, "p");
      b.connect(srcB.t, vor.nodeId, "t");
      return vor;
    });

    const mul = b.add("math", { op: "mul" });
    b.connect(fbm, mul.nodeId, "a");
    b.connect(vor, mul.nodeId, "b");

    const ramp = b.colorRamp(mul, [
      [0.05, 0.02, 0.18],
      [0.99, 0.62, 0.16],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
