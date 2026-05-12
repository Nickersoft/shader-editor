import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "magic",
  name: "Magic",
  description: "Recursive sin/cos swirl — Procedural Field preset",
  color: "#a78bfa",
  stages: () => [
    { typeId: "magic-texture", config: { depth: 2, scale: 3, distortion: 1 } },
    {
      typeId: "color-ramp-4",
      config: {
        colorA: [0.95, 0.27, 0.42],
        colorB: [0.99, 0.62, 0.16],
        colorC: [0.42, 0.09, 0.9],
        colorD: [0.07, 0.46, 0.85],
      },
    },
  ],
} satisfies ProceduralPreset;
