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
    // mix(black, strand.color, strand.alpha) — `a` defaults to vec3(0).
    const mix = b.add("mix-color", {});
    b.connect({ nodeId: st.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: st.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  },
} satisfies ProceduralPreset;
