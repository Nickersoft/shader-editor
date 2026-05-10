// Top-level barrel for the authoring layer.
//
// Each primitive file under <category>/ registers its class with the global
// Registry by importing `register` and calling it at module load. This file
// imports each category barrel (transitively, every primitive) so a single
// `import '@/shaders'` is enough to populate the registry.
//
// Categories mirror the bucketing at shaders.com/docs/components.

import { chain, type ShaderChain } from './core/chain'

export * from './core'

import './textures'
import './shapes'
import './shape-effects'
import './stylize'
import './interactive'
import './distortion'
import './blurs'
import './adjustments'

import { Ring } from './shapes/ring'
import { PolarFlowField } from './distortion/polar-flow-field'

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

function smokeRingChain(): ShaderChain {
  return chain()
    .pipe(
      new Ring({
        config: {
          x: 0.5,
          y: 0.5,
          width: 0.4,
          height: 0.4,
          rotation: 0,
          thickness: 0.6,
          innerShape: 1.0,
          fillColor: [1, 1, 1],
          strokeColor: [0, 0, 0],
          strokeWidth: 0,
          strokeMode: 'center',
        },
      }),
    )
    .pipe(
      new PolarFlowField({
        config: {
          mode: 'radial-dilate',
          centerX: 0.5,
          centerY: 0.5,
          intensity: 1.0,
          detail: 1.5,
          evolutionSpeed: 0.5,
          loopDuration: 3,
          edges: 'transparent',
        },
      }),
    )
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    slug: 'paper-design',
    name: 'Paper Design',
    description: 'Recreations of paper-design/shaders presets',
    presets: [
      {
        name: 'Smoke Ring',
        fidelity: 'approx',
        chain: smokeRingChain(),
      },
    ],
  },
]

export const FLAT_PRESETS: PresetEntry[] = PRESET_GROUPS.flatMap((g) => g.presets)
