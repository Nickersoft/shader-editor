import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "beam",
  name: "Beam",
  description: "Directional light beam — Procedural Field preset",
  color: "#fde68a",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const bm = b.add("beam", { angle: 0, width: 0.2, softness: 0.3 });
    b.connect(p, bm.nodeId, "p");
    const ramp = b.colorRamp(bm, [
      [0, 0, 0],
      [1, 0.5, 0.2],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
