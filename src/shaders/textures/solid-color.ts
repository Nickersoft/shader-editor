import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "solid-color",
  name: "Solid Color",
  description: "Fill the canvas with a single solid color — Procedural Field preset",
  color: "#a3a3a3",
  stages: () => [
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.357, 0.094, 0.792], colorB: [0.357, 0.094, 0.792] },
    },
  ],
} satisfies ProceduralPreset;
