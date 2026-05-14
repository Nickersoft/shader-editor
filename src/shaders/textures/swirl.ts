import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "swirl",
  name: "Swirl",
  description: "Multi-layered noise swirl — Procedural Field preset",
  color: "#22d3ee",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const w1 = b.domainWarp(src.p, src.t, {
      amplitude: 1, detail: 4, scale: 1, timePhase: 1,
    });
    const w2 = b.domainWarp(w1, src.t, {
      amplitude: 1, detail: 4, scale: 1.6, timePhase: 1.3,
    });
    const fbm = b.add("noise-texture", { kind: "fbm", detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect(src.t, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0.88, 0.57, 0.21],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
