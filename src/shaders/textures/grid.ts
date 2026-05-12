import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "grid",
  name: "Grid",
  description: "Orthogonal grid lines — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "grid-lines", config: { scale: 10, lineWidth: 0.06, softness: 0.04 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
