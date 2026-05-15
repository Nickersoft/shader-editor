import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "hex-grid",
  name: "Hex Grid",
  description: "Honeycomb hexagonal grid — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const hg = b.add("lattice-mask", { mode: "hex", scale: 8, lineWidth: 1 });
    b.connect(p, hg.nodeId, "p");
    const ramp = b.colorRamp(hg, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
