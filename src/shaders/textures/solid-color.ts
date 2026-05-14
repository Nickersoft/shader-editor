import type { ProceduralPreset } from "./procedural-presets";
import { PresetGraphBuilder } from "./preset-graphs/builders";

export default {
  id: "solid-color",
  name: "Solid Color",
  description: "Fill the canvas with a single solid color — Procedural Field preset",
  color: "#a3a3a3",
  graph: () => {
    const b = new PresetGraphBuilder();
    b.groupInput([]);
    // A two-stop ramp sampled at t=0 collapses to its first stop — no
    // upstream wiring needed.
    const ramp = b.add(
      "color-ramp",
      {
        stops: [
          { position: 0, color: [0.357, 0.094, 0.792] },
          { position: 1, color: [0.357, 0.094, 0.792] },
        ],
      },
      { t: 0 },
    );
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
