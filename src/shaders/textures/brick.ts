import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "brick",
  name: "Brick",
  description: "Running-bond brick pattern — Procedural Field preset",
  color: "#dc2626",
  stages: () => [
    { typeId: "brick-texture", config: { scale: 5 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.18, 0.16, 0.15], colorB: [0.78, 0.34, 0.24] },
    },
  ],
} satisfies ProceduralPreset;
