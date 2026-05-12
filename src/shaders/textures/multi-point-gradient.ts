import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "multi-point-gradient",
  name: "Multi-Point Gradient",
  description: "Four-stop linear gradient — Procedural Field preset",
  color: "#10b981",
  stages: () => [
    { typeId: "gradient-texture", config: { type: "linear" } },
    {
      typeId: "color-ramp-4",
      config: {
        colorA: [0.95, 0.27, 0.42],
        colorB: [0.99, 0.62, 0.16],
        colorC: [0.31, 0.78, 0.47],
        colorD: [0.16, 0.5, 0.95],
      },
    },
  ],
} satisfies ProceduralPreset;
