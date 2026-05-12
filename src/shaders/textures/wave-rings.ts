import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "wave-rings",
  name: "Wave Rings",
  description: "Concentric ring waves — Procedural Field preset",
  color: "#8b5cf6",
  stages: () => [
    {
      typeId: "wave-texture",
      config: { type: "rings", profile: "sine", scale: 6, distortion: 0.3, detail: 2 },
    },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.05, 0.05, 0.1], colorB: [0.95, 0.95, 1] },
    },
  ],
} satisfies ProceduralPreset;
