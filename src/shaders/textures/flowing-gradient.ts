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
    const src = b.add("field-source", { scale: 1, speed: 1, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const w1 = b.add("domain-warp", { amplitude: 0.8, detail: 2, scale: 0.8, timePhase: 1 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, w1.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w1.nodeId, "t");
    const w2 = b.add("domain-warp", { amplitude: 0.8, detail: 2, scale: 1, timePhase: 1.3 });
    b.connect(w1, w2.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, w2.nodeId, "t");
    const fbm = b.add("fbm-sample", { detail: 2, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(w2, fbm.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, fbm.nodeId, "t");
    const ramp = b.colorRamp(fbm, [
      [0.04, 0.0, 0.08],
      [0.42, 0.09, 0.9],
      [1.0, 0.3, 0.42],
      [1.0, 0.42, 0.21],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
