import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "godrays",
  name: "God Rays",
  description: "Volumetric light rays — Procedural Field preset",
  color: "#facc15",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const center = b.add("const", { value: 0 });
    const cz = b.add("combine-xy", {});
    b.connect(center, cz.nodeId, "x");
    b.connect(center, cz.nodeId, "y");
    const gr = b.add("god-rays", { density: 0.3, decay: 0.6, weight: 0.8 });
    b.connect(p, gr.nodeId, "p");
    b.connect(cz, gr.nodeId, "center");
    b.connect(t, gr.nodeId, "t");
    const ramp = b.colorRamp(gr, [
      [0, 0, 0],
      [1, 0.95, 0.7],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
