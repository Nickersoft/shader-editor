import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "truchet",
  name: "Truchet",
  description: "Quarter-circle arc tiles — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const tr = b.add("truchet", { scale: 10, lineWidth: 2, seed: 0 });
    b.connect(p, tr.nodeId, "p");
    const ramp = b.colorRamp(tr, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
