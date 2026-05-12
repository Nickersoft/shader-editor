import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "magic",
  name: "Magic",
  description: "Recursive sin/cos swirl — Procedural Field preset",
  color: "#a78bfa",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const mg = b.add("magic-texture", { depth: 2, scale: 3, distortion: 1 });
    b.connect(p, mg.nodeId, "p");
    b.connect(t, mg.nodeId, "t");
    const ramp = b.colorRamp(mg, [
      [0.95, 0.27, 0.42],
      [0.99, 0.62, 0.16],
      [0.42, 0.09, 0.9],
      [0.07, 0.46, 0.85],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
