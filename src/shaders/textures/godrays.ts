import type { ProceduralPreset } from "./procedural-presets";
import { godRaysGraph } from "@/shaders/node-graph/test-graphs";

// God Rays is the canonical decomposition exemplar — the entire effect lives
// as a 28-node DAG so users can crank up the angular frequency, swap in
// simplex/white noise instead of valueNoise, or rewire `r → power` to make
// rays brighten at the edges instead of fading. The factory lives in
// `test-graphs.ts` because Phase 2 used it as the inventory gate; this
// preset is the production consumer.
export default {
  id: "godrays",
  name: "God Rays",
  description: "Volumetric light rays — Procedural Field preset",
  color: "#facc15",
  graph: godRaysGraph,
} satisfies ProceduralPreset;
