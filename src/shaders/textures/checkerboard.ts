import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "checker",
  name: "Checker",
  description: "Hard checker pattern — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const ck = b.add("checker-texture", { scale: 8 });
    b.connect(p, ck.nodeId, "p");
    const ramp = b.colorRamp(ck, [
      [0.95, 0.95, 0.95],
      [0.05, 0.05, 0.05],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
