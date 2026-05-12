import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "hex-grid",
  name: "Hex Grid",
  description: "Honeycomb hexagonal grid — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "hex-grid", config: { scale: 8, lineWidth: 1 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0, 0, 0], colorB: [1, 1, 1] },
    },
  ],
} satisfies ProceduralPreset;
