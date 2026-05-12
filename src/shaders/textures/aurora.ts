import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "aurora",
  name: "Aurora",
  description: "Layered curtains of light — Procedural Field preset",
  color: "#22ee88",
  stages: () => [
    { typeId: "field-source", config: { scale: 1.2, speed: 0.4, seed: 0 } },
    { typeId: "domain-warp", config: { amplitude: 0.8, detail: 4, scale: 1.0, timePhase: 0.6 } },
    { typeId: "domain-warp", config: { amplitude: 0.5, detail: 4, scale: 1.8, timePhase: 1.1 } },
    { typeId: "fbm-sample", config: { detail: 5, roughness: 0.5, lacunarity: 2, distortion: 0 } },
    {
      typeId: "color-ramp-4",
      config: {
        colorA: [0.04, 0.0, 0.08],
        colorB: [0.09, 0.58, 0.91],
        colorC: [0.13, 0.93, 0.53],
        colorD: [0.65, 0.2, 0.97],
      },
    },
  ],
} satisfies ProceduralPreset;
