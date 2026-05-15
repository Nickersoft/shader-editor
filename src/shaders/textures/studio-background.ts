import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "studio-background",
  name: "Studio Background",
  description: "Radial studio key + fill wash — Procedural Field preset",
  color: "#94a3b8",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const uv = b.screenUv();
    const domain = b.add("gradient-domain", { mode: "radial" });
    b.connect(uv, domain.nodeId, "p");
    const ramp = b.colorRamp(domain, [
      [0.95, 0.97, 1.0],
      [0.83, 0.89, 0.92],
      [0.78, 0.83, 0.91],
      [0.65, 0.71, 0.83],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
