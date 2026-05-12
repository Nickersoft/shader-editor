import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "falling-lines",
  name: "Falling Lines",
  description: "Directional falling streaks — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [{ typeId: "falling-lines", config: {} }],
} satisfies ProceduralPreset;
