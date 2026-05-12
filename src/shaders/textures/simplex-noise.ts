import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "simplex-noise",
  name: "Simplex Noise",
  description: "Organic noise field — Procedural Field preset",
  color: "#8b5cf6",
  stages: () => [
    { typeId: "field-source", config: { scale: 2, speed: 1, seed: 0 } },
    { typeId: "fbm-sample", config: { detail: 5 } },
    { typeId: "remap", config: { balance: 0, contrast: 0 } },
    { typeId: "color-ramp-2", config: { colorA: [1, 1, 1], colorB: [0, 0, 0] } },
  ],
} satisfies ProceduralPreset;
