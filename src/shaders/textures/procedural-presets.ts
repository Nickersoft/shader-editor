import aurora from "./aurora";
import beam from "./beam";
import blob from "./blob";
import branchedNoise from "./branched-noise";
import brick from "./brick";
import checkerboard from "./checkerboard";
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

import type { StageChainEntry } from "./procedural-field.svelte";

/**
 * Aux-input wiring inside a preset, expressed by stage *index* — stage IDs are
 * minted fresh on instantiation, so the composer resolves indices to IDs at
 * the moment a preset is added to the scene.
 */
export interface PresetEdge {
  fromIndex: number;
  toIndex: number;
  toPort: string;
}

export interface ProceduralPreset {
  id: string;
  name: string;
  description: string;
  color: string;
  stages: () => StageChainEntry[];
  edges?: () => PresetEdge[];
}

export const PROCEDURAL_PRESETS: readonly ProceduralPreset[] = [
  aurora,
  beam,
  blob,
  branchedNoise,
  brick,
  checkerboard,
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
  ripples,
  simplexNoise,
  sineWave,
  solidColor,
  spiral,
  strands,
  stripes,
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
