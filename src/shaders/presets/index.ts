import type { ShaderChain } from '@/shaders/core/chain'

import MeshGradientDefault from './mesh-gradient-default'
import MeshGradientPurple from './mesh-gradient-purple'
import MeshGradientBeach from './mesh-gradient-beach'
import StaticMeshGradientDefault from './static-mesh-gradient-default'
import StaticMeshGradientSea from './static-mesh-gradient-sea'
import NeuroNoiseDefault from './neuro-noise-default'
import NeuroNoiseCyan from './neuro-noise-cyan'
import SwirlDefault from './swirl-default'
import SwirlCandy from './swirl-candy'
import SpiralDefault from './spiral-default'
import SpiralJungle from './spiral-jungle'
import SimplexNoiseDefault from './simplex-noise-default'
import SimplexNoiseStepped from './simplex-noise-stepped'
import SimplexNoiseBubblegum from './simplex-noise-bubblegum'
import PerlinNoiseDefault from './perlin-noise-default'
import PerlinNoiseNintendoWater from './perlin-noise-nintendo-water'
import VoronoiCells from './voronoi-cells'
import WavesDefault from './waves-default'
import WavesGroovy from './waves-groovy'
import GodRaysDefault from './god-rays-default'
import GodRaysEther from './god-rays-ether'
import DotGridDefault from './dot-grid-default'
import DotGridDiamond from './dot-grid-diamond'
import StaticRadialGradientDefault from './static-radial-gradient-default'
import ColorPanelsDefault from './color-panels-default'
import ColorPanelsGlass from './color-panels-glass'
import ColorPanelsGradient from './color-panels-gradient'
import GrainGradientDefault from './grain-gradient-default'
import DitheringDefault from './dithering-default'
import PulsingBorderDefault from './pulsing-border-default'
import PulsingBorderNorthernLights from './pulsing-border-northern-lights'
import PulsingBorderSolidLine from './pulsing-border-solid-line'
import HeatmapDefault from './heatmap-default'
import ImageDitheringDefault from './image-dithering-default'
import ImageDitheringRetro from './image-dithering-retro'
import HalftoneDotsDefault from './halftone-dots-default'
import LiquidMetalDefault from './liquid-metal-default'
import PaperTextureDefault from './paper-texture-default'
import PaperTextureCardboard from './paper-texture-cardboard'
import WaterDefault from './water-default'
import MetaballsDefault from './metaballs-default'
import MetaballsLava from './metaballs-lava'
import DotOrbitDefault from './dot-orbit-default'
import DotOrbitConfetti from './dot-orbit-confetti'
import SmokeRingDefault from './smoke-ring-default'
import SmokeRingAurora from './smoke-ring-aurora'
import WarpDefault from './warp-default'
import WarpMarbled from './warp-marbled'
import WarpEdge from './warp-edge'
import FlutedGlassDefault from './fluted-glass-default'
import FlutedGlassFrosted from './fluted-glass-frosted'
import GemSmokeDefault from './gem-smoke-default'
import HalftoneCmykDefault from './halftone-cmyk-default'
import HalftoneCmykNewsprint from './halftone-cmyk-newsprint'

export type PresetFidelity = 'primitive' | 'approx' | 'reference'

export interface PresetEntry {
  name: string
  fidelity: PresetFidelity
  chain: ShaderChain
}

export interface PresetGroup {
  slug: string
  name: string
  description: string
  presets: PresetEntry[]
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    slug: "mesh-gradient",
    name: "Mesh Gradient",
    description: "Animated color blobs through Mesh Spots + Organic Warp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: MeshGradientDefault },
      { name: "Purple", fidelity: "primitive", chain: MeshGradientPurple },
      { name: "Beach", fidelity: "primitive", chain: MeshGradientBeach },
    ],
  },
  {
    slug: "static-mesh-gradient",
    name: "Static Mesh",
    description: "Frozen color blobs via Mesh Spots (speed=0)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: StaticMeshGradientDefault },
      { name: "Sea", fidelity: "primitive", chain: StaticMeshGradientSea },
    ],
  },
  {
    slug: "neuro-noise",
    name: "Neuro Noise",
    description: "Synaptic web via Scalar Field (tendrils mode) + Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: NeuroNoiseDefault },
      { name: "Cyan", fidelity: "primitive", chain: NeuroNoiseCyan },
    ],
  },
  {
    slug: "swirl",
    name: "Swirl",
    description: "Twisting radial bands via Polar Bands primitive",
    presets: [
      { name: "Default", fidelity: "primitive", chain: SwirlDefault },
      { name: "Candy", fidelity: "primitive", chain: SwirlCandy },
    ],
  },
  {
    slug: "spiral",
    name: "Spiral",
    description: "Logarithmic spiral via Spiral Stripe primitive",
    presets: [
      { name: "Default", fidelity: "primitive", chain: SpiralDefault },
      { name: "Jungle", fidelity: "primitive", chain: SpiralJungle },
    ],
  },
  {
    slug: "simplex-noise",
    name: "Simplex Noise",
    description: "Scalar Field (FBM) → Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: SimplexNoiseDefault },
      { name: "Stepped", fidelity: "primitive", chain: SimplexNoiseStepped },
      { name: "Bubblegum", fidelity: "primitive", chain: SimplexNoiseBubblegum },
    ],
  },
  {
    slug: "perlin-noise",
    name: "Perlin Noise",
    description: "Scalar Field (FBM, more octaves) → Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: PerlinNoiseDefault },
      { name: "Nintendo Water", fidelity: "primitive", chain: PerlinNoiseNintendoWater },
    ],
  },
  {
    slug: "voronoi",
    name: "Voronoi",
    description: "Colored cell mosaic via Voronoi Cells primitive",
    presets: [
      { name: "Default", fidelity: "primitive", chain: VoronoiCells },
    ],
  },
  {
    slug: "waves",
    name: "Waves",
    description: "Scalar Field (waves mode) → Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: WavesDefault },
      { name: "Groovy", fidelity: "primitive", chain: WavesGroovy },
    ],
  },
  {
    slug: "god-rays",
    name: "God Rays",
    description: "Radial God Rays generator + Glow Field",
    presets: [
      { name: "Default", fidelity: "primitive", chain: GodRaysDefault },
      { name: "Ether", fidelity: "primitive", chain: GodRaysEther },
    ],
  },
  {
    slug: "dot-grid",
    name: "Dot Grid",
    description: "Regular geometric dot lattice via Dot Glyph Grid",
    presets: [
      { name: "Default", fidelity: "primitive", chain: DotGridDefault },
      { name: "Diamond", fidelity: "primitive", chain: DotGridDiamond },
    ],
  },
  {
    slug: "static-radial-gradient",
    name: "Static Radial",
    description: "Three-stop radial gradient",
    presets: [
      { name: "Default", fidelity: "approx", chain: StaticRadialGradientDefault },
    ],
  },
  {
    slug: "color-panels",
    name: "Color Panels",
    description: "Pseudo-3D rotating translucent panels",
    presets: [
      { name: "Default", fidelity: "primitive", chain: ColorPanelsDefault },
      { name: "Glass", fidelity: "primitive", chain: ColorPanelsGlass },
      { name: "Gradient", fidelity: "primitive", chain: ColorPanelsGradient },
    ],
  },
  {
    slug: "grain-gradient",
    name: "Grain Gradient",
    description: "Mesh Spots + Organic Warp + Grain overlay",
    presets: [
      { name: "Default", fidelity: "primitive", chain: GrainGradientDefault },
    ],
  },
  {
    slug: "dithering",
    name: "Dithering",
    description: "Scalar Field → Dither (Bayer 4×4)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: DitheringDefault },
    ],
  },
  {
    slug: "pulsing-border",
    name: "Pulsing Border",
    description: "Coloured spots travelling around a rounded-rect perimeter",
    presets: [
      { name: "Default", fidelity: "primitive", chain: PulsingBorderDefault },
      { name: "Northern Lights", fidelity: "primitive", chain: PulsingBorderNorthernLights },
      { name: "Solid Line", fidelity: "primitive", chain: PulsingBorderSolidLine },
    ],
  },
  {
    slug: "heatmap",
    name: "Heatmap",
    description: "Image → Alpha Falloff → Heatwave",
    presets: [
      { name: "Default", fidelity: "primitive", chain: HeatmapDefault },
    ],
  },
  {
    slug: "image-dithering",
    name: "Image Dithering",
    description: "Image → Luminance Tap → Dither",
    presets: [
      { name: "Default", fidelity: "primitive", chain: ImageDitheringDefault },
      { name: "Retro", fidelity: "primitive", chain: ImageDitheringRetro },
    ],
  },
  {
    slug: "halftone-dots",
    name: "Halftone Dots",
    description: "Image → Halftone screen",
    presets: [
      { name: "Default", fidelity: "primitive", chain: HalftoneDotsDefault },
    ],
  },
  {
    slug: "liquid-metal",
    name: "Liquid Metal",
    description: "Image → Liquid Metal (Paper-faithful CPU + GPU pipeline)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: LiquidMetalDefault },
    ],
  },
  {
    slug: "paper-texture",
    name: "Paper Texture",
    description: "Image → Material Noise (multiply)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: PaperTextureDefault },
      { name: "Cardboard", fidelity: "primitive", chain: PaperTextureCardboard },
    ],
  },
  {
    slug: "water",
    name: "Water",
    description: "Image → Water Ripple → Glow Field (caustics)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: WaterDefault },
    ],
  },
  {
    slug: "metaballs",
    name: "Metaballs",
    description: "Gooey blobs blending via the Metaballs primitive",
    presets: [
      { name: "Default", fidelity: "primitive", chain: MetaballsDefault },
      { name: "Lava", fidelity: "primitive", chain: MetaballsLava },
    ],
  },
  {
    slug: "dot-orbit",
    name: "Dot Orbit",
    description: "Animated dot grid where each dot orbits its cell centre",
    presets: [
      { name: "Default", fidelity: "primitive", chain: DotOrbitDefault },
      { name: "Confetti", fidelity: "primitive", chain: DotOrbitConfetti },
    ],
  },
  {
    slug: "smoke-ring",
    name: "Smoke Ring",
    description: "Ring Scalar → Polar FBM Distort → Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: SmokeRingDefault },
      { name: "Aurora", fidelity: "primitive", chain: SmokeRingAurora },
    ],
  },
  {
    slug: "warp",
    name: "Warp",
    description: "Soft base pattern (checks / stripes / edge) → Organic Warp → Color Ramp",
    presets: [
      { name: "Default", fidelity: "primitive", chain: WarpDefault },
      { name: "Marbled", fidelity: "primitive", chain: WarpMarbled },
      { name: "Edge", fidelity: "primitive", chain: WarpEdge },
    ],
  },
  {
    slug: "fluted-glass",
    name: "Fluted Glass",
    description: "Image → Fluted Glass distorter (lanes + highlights + shadows)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: FlutedGlassDefault },
      { name: "Frosted", fidelity: "primitive", chain: FlutedGlassFrosted },
    ],
  },
  {
    slug: "gem-smoke",
    name: "Gem Smoke",
    description: "Image silhouette with swirling smoke and chromatic refraction",
    presets: [
      { name: "Default", fidelity: "approx", chain: GemSmokeDefault },
    ],
  },
  {
    slug: "halftone-cmyk",
    name: "Halftone CMYK",
    description: "Image → Halftone CMYK (four rotated screens, subtractive ink)",
    presets: [
      { name: "Default", fidelity: "primitive", chain: HalftoneCmykDefault },
      { name: "Newsprint", fidelity: "primitive", chain: HalftoneCmykNewsprint },
    ],
  },
]

export const FLAT_PRESETS: PresetEntry[] = PRESET_GROUPS.flatMap((g) => g.presets)
