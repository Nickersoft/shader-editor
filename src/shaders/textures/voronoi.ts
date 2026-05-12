import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "voronoi",
  name: "Voronoi Cells",
  description: "Cellular pattern — Procedural Field preset",
  color: "#06b6d4",
  stages: () => [
    { typeId: "field-source", config: { scale: 6, speed: 0.5, seed: 0 } },
    {
      typeId: "voronoi-sample",
      config: { feature: "f1", metric: "euclidean", randomness: 1, smoothness: 0.25 },
    },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.19, 0.53, 0.81], colorB: [0.99, 0.01, 0.87] },
    },
  ],
} satisfies ProceduralPreset;
