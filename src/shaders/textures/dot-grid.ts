import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "dot-grid",
  name: "Dot Grid",
  description: "Grid of dots — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const dg = b.add("dot-grid", { scale: 30, radius: 0.3, softness: 0.05 });
    b.connect(p, dg.nodeId, "p");
    const ramp = b.colorRamp(dg, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
