import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "godrays",
  name: "God Rays",
  description: "Volumetric light rays — Procedural Field preset",
  color: "#facc15",
  stages: () => [
    { typeId: "god-rays", config: { center: [0, 0], density: 0.3, decay: 0.6, weight: 0.8 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [1, 0.95, 0.7], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
