import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "spiral",
  name: "Spiral",
  description: "Polar-warped wave spiral — Procedural Field preset",
  color: "#a855f7",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.fieldTransform(p, t, { scale: 1, speed: 1, seed: 0 });
    const polar = b.polarDomain(src.p, 1, 1);
    const wv = b.add("wave-texture", {
      type: "bands",
      profile: "sine",
      scale: 1.5,
      phaseOffset: 0,
      distortion: 0,
      detail: 3,
    });
    b.connect(polar, wv.nodeId, "p");
    const ramp = b.colorRamp(wv, [
      [1, 1, 1],
      [0, 0, 0],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
