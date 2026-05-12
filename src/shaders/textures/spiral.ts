import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "spiral",
  name: "Spiral",
  description: "Polar-warped wave spiral — Procedural Field preset",
  color: "#a855f7",
  stages: () => [
    { typeId: "field-source", config: { scale: 1, speed: 1, seed: 0 } },
    { typeId: "polar-domain", config: { radialScale: 1, angularScale: 1 } },
    {
      typeId: "wave-texture",
      config: { type: "bands", profile: "sine", scale: 1.5, distortion: 0, detail: 0 },
    },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
