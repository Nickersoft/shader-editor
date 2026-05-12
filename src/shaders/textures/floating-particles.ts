import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "floating-particles",
  name: "Floating Particles",
  description: "Layered drifting particles — Procedural Field preset",
  color: "#fbbf24",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const fp = b.add("floating-particles", {});
    const z = b.add("const", { value: 0 });
    const black = b.colorRamp(z, [
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const mix = b.add("mix-color", {});
    b.connect(black, mix.nodeId, "a");
    b.connect({ nodeId: fp.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: fp.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  },
} satisfies ProceduralPreset;
