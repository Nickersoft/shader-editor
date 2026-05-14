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
    // mix(black, particle.color, particle.alpha) — `a` defaults to vec3(0).
    const mix = b.add("mix-color", {});
    b.connect({ nodeId: fp.nodeId, pin: "color" }, mix.nodeId, "b");
    b.connect({ nodeId: fp.nodeId, pin: "alpha" }, mix.nodeId, "t");
    return b.output(mix);
  },
} satisfies ProceduralPreset;
