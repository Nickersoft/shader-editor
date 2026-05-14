import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "ripples",
  name: "Ripples",
  description: "Concentric animated ripples — Procedural Field preset",
  color: "#22d3ee",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const rw = b.add("ripple-texture", { frequency: 20, speed: 1, phase: 0 });
    b.connect(p, rw.nodeId, "p");
    b.connect(t, rw.nodeId, "t");
    const ramp = b.colorRamp(rw, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
