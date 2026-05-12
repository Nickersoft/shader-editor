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
    const src = b.add("field-source", { scale: 1, speed: 1, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const w1 = b.add("domain-warp", { amplitude: 1, detail: 4, scale: 1, timePhase: 1 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, w1.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w1.nodeId, "t");
    const w2 = b.add("domain-warp", { amplitude: 1, detail: 4, scale: 1.6, timePhase: 1.3 });
    b.connect(w1, w2.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w2.nodeId, "t");
    const fbm = b.add("fbm-sample", { detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0.88, 0.57, 0.21],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
