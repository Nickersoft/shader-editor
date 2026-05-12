import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "strands",
  name: "Strands",
  description: "Wavy strand bundle — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [{ typeId: "strands", config: {} }],
} satisfies ProceduralPreset;
