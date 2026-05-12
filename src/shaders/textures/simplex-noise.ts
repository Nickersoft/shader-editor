import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "simplex-noise",
  name: "Simplex Noise",
  description: "Organic noise field — Procedural Field preset",
  color: "#8b5cf6",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.add("field-source", { scale: 2, speed: 1, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const fbm = b.add("fbm-sample", { detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, fbm.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
