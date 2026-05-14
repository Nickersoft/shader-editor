import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "voronoi",
  name: "Voronoi Cells",
  description: "Cellular pattern — Procedural Field preset",
  color: "#06b6d4",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 6, speed: 0.5, seed: 0 });
    const vor = b.add("voronoi-texture", {
      feature: "f1",
      metric: "euclidean",
      randomness: 1,
      smoothness: 0.25,
    });
    b.connect(src.p, vor.nodeId, "p");
    b.connect(src.t, vor.nodeId, "t");
    const ramp = b.colorRamp(vor, [
      [0.99, 0.01, 0.87],
      [0.19, 0.53, 0.81],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
