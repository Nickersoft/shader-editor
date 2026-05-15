// Preset catalog for ProceduralField. Each entry pairs identity metadata
// (id / name / colour / blurb) with a `graph()` factory that returns a fresh
// `NodeGraph` — IDs inside the graph are minted lexically per preset, so the
// factory is called once per layer instantiation to avoid shared state across
// scenes.
//
// Phase 3 superseded the old stage-chain shape; every preset here is now a
// real DAG of primitives.

import type { NodeGraph } from "@/shaders/node-graph";

import aurora from "./aurora";
import beam from "./beam";
import blob from "./blob";
import branchedNoise from "./branched-noise";
import brick from "./brick";
import checkerboard from "./checkerboard";
import conicGradient from "./conic-gradient";
import diamondGradient from "./diamond-gradient";
import dotGrid from "./dot-grid";
import fallingLines from "./falling-lines";
import floatingParticles from "./floating-particles";
import flowingGradient from "./flowing-gradient";
import godrays from "./godrays";
import gradient from "./gradient";
import grid from "./grid";
import hexGrid from "./hex-grid";
import magic from "./magic";
import multiPointGradient from "./multi-point-gradient";
import plasma from "./plasma";
import radialGradient from "./radial-gradient";
import ripples from "./ripples";
import simplexNoise from "./simplex-noise";
import sineWave from "./sine-wave";
import solidColor from "./solid-color";
import spiral from "./spiral";
import strands from "./strands";
import stripes from "./stripes";
import studioBackground from "./studio-background";
import swirl from "./swirl";
import truchet from "./truchet";
import voronoi from "./voronoi";
import waveRings from "./wave-rings";
import weave from "./weave";
import whiteNoise from "./white-noise";

export interface ProceduralPreset {
  id: string;
  name: string;
  description: string;
  color: string;
  graph: () => NodeGraph;
}

export const PROCEDURAL_PRESETS: readonly ProceduralPreset[] = [
  aurora,
  beam,
  blob,
  branchedNoise,
  brick,
  checkerboard,
  conicGradient,
  diamondGradient,
  dotGrid,
  fallingLines,
  floatingParticles,
  flowingGradient,
  godrays,
  gradient,
  grid,
  hexGrid,
  magic,
  multiPointGradient,
  plasma,
  radialGradient,
  ripples,
  simplexNoise,
  sineWave,
  solidColor,
  spiral,
  strands,
  studioBackground,
  swirl,
  truchet,
  voronoi,
  waveRings,
  weave,
  whiteNoise,
];

export function getProceduralPreset(id: string): ProceduralPreset | undefined {
  return PROCEDURAL_PRESETS.find((p) => p.id === id);
}
