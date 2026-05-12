import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "stripes",
  name: "Stripes",
  description: "Banded wave (sine profile) — Procedural Field preset",
  color: "#475569",
  stages: () => [
    { typeId: "field-source", config: { scale: 1, speed: 0.4, seed: 0 } },
    {
      typeId: "wave-texture",
      config: { type: "bands", profile: "sine", scale: 5, distortion: 0, detail: 0 },
    },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
