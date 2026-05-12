import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "studio-background",
  name: "Studio Background",
  description: "Radial studio key + fill wash — Procedural Field preset",
  color: "#94a3b8",
  stages: () => [
    { typeId: "gradient-texture", config: { type: "spherical" } },
    {
      typeId: "color-ramp-4",
      config: {
        colorA: [0.65, 0.71, 0.83],
        colorB: [0.78, 0.83, 0.91],
        colorC: [0.83, 0.89, 0.92],
        colorD: [0.95, 0.97, 1.0],
      },
    },
  ],
} satisfies ProceduralPreset;
