import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "truchet",
  name: "Truchet",
  description: "Quarter-circle arc tiles — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "truchet", config: { scale: 10, lineWidth: 2, seed: 0 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [1, 1, 1], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
