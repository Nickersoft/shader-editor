import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "sine-wave",
  name: "Sine Wave",
  description: "Animated sine wave bands — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const wv = b.add("wave-texture", {
      type: "bands",
      profile: "sine",
      scale: 5,
      phaseOffset: 0,
      distortion: 0,
      detail: 3,
    });
    b.connect(src.p, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [0, 0, 0],
      [1, 1, 1],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
