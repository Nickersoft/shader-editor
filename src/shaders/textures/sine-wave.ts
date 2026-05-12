import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "sine-wave",
  name: "Sine Wave",
  description: "Animated sine wave bands — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "field-source", config: { scale: 1, speed: 1, seed: 0 } },
    {
      typeId: "wave-texture",
      config: { type: "bands", profile: "sine", scale: 5, distortion: 0, detail: 0 },
    },
    {
      typeId: "color-ramp-2",
      config: { colorA: [1, 1, 1], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
