import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "flowing-gradient",
  name: "Flowing Gradient",
  description: "Liquid silk gradient — Procedural Field preset",
  color: "#6b17e6",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const w1 = b.domainWarp(src.p, src.t, {
      amplitude: 0.8, detail: 2, scale: 0.8, timePhase: 1,
    });
    const w2 = b.domainWarp(w1, src.t, {
      amplitude: 0.8, detail: 2, scale: 1, timePhase: 1.3,
    });
    const fbm = b.add("noise-texture", { kind: "fbm", detail: 2, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect(src.t, fbm.nodeId, "t");
    const ramp = b.colorRamp(fbm, [
      [0.04, 0.0, 0.08],
      [0.42, 0.09, 0.9],
      [1.0, 0.3, 0.42],
      [1.0, 0.42, 0.21],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
