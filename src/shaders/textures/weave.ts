import type { ProceduralPreset } from "./procedural-presets";

export default {
  id: "weave",
  name: "Weave",
  description: "Interlaced thread weave — Procedural Field preset",
  color: "#0ea5e9",
  stages: () => [
    { typeId: "weave", config: { scale: 10, gap: 0.25 } },
    {
      typeId: "color-ramp-2",
      config: { colorA: [0.77, 0.77, 0.77], colorB: [0.3, 0.3, 0.3] },
    },
  ],
} satisfies ProceduralPreset;
