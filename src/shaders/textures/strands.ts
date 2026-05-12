import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "strands",
  name: "Strands",
  description: "Wavy strand bundle — Procedural Field preset",
  color: "#0ea5e9",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    const st = b.add("strands", {});
    const z = b.add("const", { value: 0 });
    const black = b.colorRamp(z, [
      [0, 0, 0],
      [0, 0, 0],
    ]);
    const mix = b.add("mix-color", {});
    b.connect(black, mix.nodeId, "a");
    b.connect({ nodeId: st.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: st.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  },
} satisfies ProceduralPreset;
