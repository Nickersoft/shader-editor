import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "weave",
  name: "Weave",
  description: "Interlaced thread weave — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const wv = b.add("weave", { scale: 10, gap: 0.25 });
    b.connect(p, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [0.3, 0.3, 0.3],
      [0.77, 0.77, 0.77],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
