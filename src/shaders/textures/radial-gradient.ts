import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "radial-gradient",
  name: "Radial Gradient",
  description: "Circular gradient with draggable center + radius",
  color: "#ec4899",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("radial-gradient-domain", {});
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [1.0, 0.8, 0.4],
      [0.1, 0.05, 0.2],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
