import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "white-noise",
  name: "White Noise",
  description: "Per-pixel hash random — Procedural Field preset",
  color: "#e5e7eb",
  stages: () => [
    { typeId: "white-noise-texture", config: { scale: 80 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
