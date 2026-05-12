import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "plasma",
  name: "Plasma",
  description: "Animated plasma effect — Procedural Field preset",
  color: "#ec4899",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const p = b.position();
    const t = b.time();
    const src = b.add("field-source", { scale: 2, speed: 2, seed: 0 });
    b.connect(p, src.nodeId, "p");
    b.connect(t, src.nodeId, "t");
    const warp = b.add("domain-warp", { amplitude: 0.4, detail: 4, scale: 1, timePhase: 1 });
    b.connect({ nodeId: src.nodeId, pin: "p" }, warp.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, warp.nodeId, "t");
    const pl = b.add("plasma-sample", { intensity: 1.5 });
    b.connect(warp, pl.nodeId, "p");
    b.connect({ nodeId: src.nodeId, pin: "t" }, pl.nodeId, "t");
    const rm = b.add("remap", { balance: 0, contrast: 0 });
    b.connect(pl, rm.nodeId, "x");
    const ramp = b.colorRamp(rm, [
      [0, 0, 0],
      [0.44, 0.09, 0.75],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
