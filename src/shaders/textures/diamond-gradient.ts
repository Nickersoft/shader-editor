import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "diamond-gradient",
  name: "Diamond Gradient",
  description: "Diamond-shaped iso-contours over a draggable center",
  color: "#f59e0b",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("diamond-gradient-domain", {});
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [1.0, 0.92, 0.45],
      [0.86, 0.21, 0.27],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
