import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "aurora",
  name: "Aurora",
  description: "Layered curtains of light — Procedural Field preset",
  color: "#22ee88",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.add("field-source", { scale: 1.2, speed: 0.4, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const w1 = b.add("domain-warp", { amplitude: 0.8, detail: 4, scale: 1.0, timePhase: 0.6 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, w1.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w1.nodeId, "t");
    const w2 = b.add("domain-warp", { amplitude: 0.5, detail: 4, scale: 1.8, timePhase: 1.1 });
    b.connect(w1, w2.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w2.nodeId, "t");
    const fbm = b.add("fbm-sample", { detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, fbm.nodeId, "t");
    const ramp = b.colorRamp(fbm, [
      [0.04, 0.0, 0.08],
      [0.09, 0.58, 0.91],
      [0.13, 0.93, 0.53],
      [0.65, 0.2, 0.97],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
