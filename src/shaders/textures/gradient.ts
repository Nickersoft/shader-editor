import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "gradient",
  name: "Gradient",
  description: "Two-stop linear gradient — Procedural Field preset",
  color: "#10b981",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "linear" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.0, 0.0, 1.0],
      [0.1, 1.0, 0.0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
