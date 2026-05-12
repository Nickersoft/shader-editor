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
    const src = b.add("field-source", { scale: 1, speed: 1, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const polar = b.add("polar-domain", { radialScale: 1, angularScale: 1 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, polar.nodeId, "p");
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
