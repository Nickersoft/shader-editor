import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "beam",
  name: "Beam",
  description: "Directional light beam — Procedural Field preset",
  color: "#fde68a",
  stages: () => [
    { typeId: "beam", config: { angle: 0, width: 0.2, softness: 0.3 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [1, 0.5, 0.2], colorB: [0, 0, 0] },
    },
  ],
} satisfies ProceduralPreset;
