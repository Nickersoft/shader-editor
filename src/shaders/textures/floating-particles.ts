import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "floating-particles",
  name: "Floating Particles",
  description: "Layered drifting particles — Procedural Field preset",
  color: "#fbbf24",
  stages: () => [{ typeId: "floating-particles", config: {} }],
} satisfies ProceduralPreset;
