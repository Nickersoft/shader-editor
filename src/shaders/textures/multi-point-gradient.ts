import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "multi-point-gradient",
  name: "Multi-Point Gradient",
  description: "Four-stop linear gradient — Procedural Field preset",
  color: "#10b981",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("linear-gradient-domain", {});
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.31, 0.78, 0.47],
      [0.16, 0.5, 0.95],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
