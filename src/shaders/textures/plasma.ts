import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "plasma",
  name: "Plasma",
  description: "Animated plasma effect — Procedural Field preset",
  color: "#ec4899",
  stages: () => [
    { typeId: "field-source", config: { scale: 2, speed: 2, seed: 0 } },
    { typeId: "domain-warp", config: { amplitude: 0.4, detail: 4, scale: 1, timePhase: 1 } },
    { typeId: "plasma-sample", config: { intensity: 1.5 } },
    { typeId: "remap", config: { balance: 0, contrast: 0 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.44, 0.09, 0.75], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
