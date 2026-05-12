import type { ProceduralPreset } from "./procedural-presets";

// Demonstrates aux-edge wiring: two independent samplers feed Mix Fields,
// which produces a noise-modulated cellular pattern that neither could alone.
export default {
  id: "branched-noise",
  name: "Branched Noise",
  description: "Mix Fields demo — multiplies a Noise field by a Voronoi field, then colorizes",
  color: "#f59e0b",
  stages: () => [
    { typeId: "field-source", config: { scale: 3, speed: 0.6, seed: 0 } },
    { typeId: "fbm-sample", config: { detail: 4 } },
    { typeId: "field-source", config: { scale: 0.6, speed: 0.4, seed: 17 } },
    {
      typeId: "voronoi-sample",
      config: { feature: "f1", randomness: 0.9, smoothness: 0.4 },
    },
    { typeId: "mix-fields", config: { factor: 0.7, mode: "multiply" } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.99, 0.62, 0.16], colorB: [0.05, 0.02, 0.18] },
    },
  ],
  edges: () => [
    { fromIndex: 1, toIndex: 4, toPort: "a" },
    { fromIndex: 3, toIndex: 4, toPort: "b" },
  ],
} satisfies ProceduralPreset;
