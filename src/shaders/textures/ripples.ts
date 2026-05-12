import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "ripples",
  name: "Ripples",
  description: "Concentric animated ripples — Procedural Field preset",
  color: "#22d3ee",
  stages: () => [
    { typeId: "ripple-wave", config: { frequency: 20, speed: 1, phase: 0 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [1, 1, 1], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
