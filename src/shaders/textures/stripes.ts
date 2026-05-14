import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "stripes",
  name: "Stripes",
  description: "Banded wave (sine profile) — Procedural Field preset",
  color: "#475569",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 0.4, seed: 0 });
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
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
