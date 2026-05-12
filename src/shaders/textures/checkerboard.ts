import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "checker",
  name: "Checker",
  description: "Hard checker pattern — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "checker-texture", config: { scale: 8 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.05, 0.05, 0.05], colorB: [0.95, 0.95, 0.95] },
    },
  ],
} satisfies ProceduralPreset;
