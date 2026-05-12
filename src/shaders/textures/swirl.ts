import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "swirl",
  name: "Swirl",
  description: "Multi-layered noise swirl — Procedural Field preset",
  color: "#22d3ee",
  stages: () => [
    { typeId: "field-source", config: { scale: 1, speed: 1, seed: 0 } },
    { typeId: "domain-warp", config: { amplitude: 1, detail: 4, scale: 1, timePhase: 1 } },
    { typeId: "domain-warp", config: { amplitude: 1, detail: 4, scale: 1.6, timePhase: 1.3 } },
    { typeId: "fbm-sample", config: { detail: 5 } },
    { typeId: "remap", config: { balance: 0, contrast: 0 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.07, 0.46, 0.85], colorB: [0.88, 0.57, 0.21] },
    },
  ],
} satisfies ProceduralPreset;
