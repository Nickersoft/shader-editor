import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "dot-grid",
  name: "Dot Grid",
  description: "Grid of dots — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "dot-grid", config: { scale: 30, radius: 0.3, softness: 0.05 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
