import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "conic-gradient",
  name: "Conic Gradient",
  description: "Angular sweep around a draggable center",
  color: "#a855f7",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "conic" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.31, 0.78, 0.47],
      [0.95, 0.27, 0.42],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
