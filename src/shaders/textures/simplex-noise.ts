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
    const src = b.fieldTransform(p, t, { scale: 2, speed: 1, seed: 0 });
    const fbm = b.add("noise-texture", { kind: "fbm", detail: 5, lacunarity: 2, roughness: 0.5, distortion: 0 });
    b.connect(src.p, fbm.nodeId, "p");
    b.connect(src.t, fbm.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(fbm, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
