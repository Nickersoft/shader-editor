import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "blob",
  name: "Blob",
  description: "Animated organic blob — Procedural Field preset",
  color: "#ff6b35",
  stages: () => [{ typeId: "blob", config: {} }],
} satisfies ProceduralPreset;
