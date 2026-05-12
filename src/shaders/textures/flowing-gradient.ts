import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "flowing-gradient",
  name: "Flowing Gradient",
  description: "Liquid silk gradient — Procedural Field preset",
  color: "#6b17e6",
  stages: () => [
    { typeId: "field-source", config: { scale: 1, speed: 1, seed: 0 } },
    { typeId: "domain-warp", config: { amplitude: 0.8, detail: 2, scale: 0.8, timePhase: 1 } },
    { typeId: "domain-warp", config: { amplitude: 0.8, detail: 2, scale: 1, timePhase: 1.3 } },
    { typeId: "fbm-sample", config: { detail: 2 } },
    {
      typeId: "color-ramp-4",
      config: {
        colorA: [0.04, 0.0, 0.08],
        colorB: [0.42, 0.09, 0.9],
        colorC: [1.0, 0.3, 0.42],
        colorD: [1.0, 0.42, 0.21],
      },
    },
  ],
} satisfies ProceduralPreset;
