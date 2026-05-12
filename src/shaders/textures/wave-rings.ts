import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "wave-rings",
  name: "Wave Rings",
  description: "Concentric ring waves — Procedural Field preset",
  color: "#8b5cf6",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const wv = b.add("wave-texture", {
      type: "rings",
      profile: "sine",
      scale: 6,
      phaseOffset: 0,
      distortion: 0.3,
      detail: 2,
    });
    b.connect(p, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [0.95, 0.95, 1],
      [0.05, 0.05, 0.1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
