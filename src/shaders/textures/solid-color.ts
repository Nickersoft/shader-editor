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
    const zero = b.add("const", { value: 0 });
    const ramp = b.colorRamp(zero, [
      [0.357, 0.094, 0.792],
      [0.357, 0.094, 0.792],
    ]);
    return b.output(ramp);
  },
} satisfies ProceduralPreset;
