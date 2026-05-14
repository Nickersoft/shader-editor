import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "white-noise",
  name: "White Noise",
  description: "Per-pixel hash random — Procedural Field preset",
  color: "#e5e7eb",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const noise = b.add("noise-texture", { kind: "white", scale: 80, seed: 0 });
    b.connect(p, noise.nodeId, "p");
    const ramp = b.colorRamp(noise, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
