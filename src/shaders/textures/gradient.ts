import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "gradient",
  name: "Gradient",
  description: "Two-stop linear gradient — Procedural Field preset",
  color: "#10b981",
  stages: () => [
    { typeId: "gradient-texture", config: { type: "linear" } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.1, 1.0, 0.0], colorB: [0.0, 0.0, 1.0] },
    },
  ],
} satisfies ProceduralPreset;
