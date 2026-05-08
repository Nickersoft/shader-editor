// Top-level barrel for the authoring layer.
//
// Each primitive file under <category>/ registers its class with the global
// Registry by importing `register` and calling it at module load. This file
// imports each category barrel (transitively, every primitive) so a single
// `import '@/shaders'` is enough to populate the registry.
//
// Categories mirror the bucketing at shaders.com/docs/components.

import type { ShaderChain } from './core/chain'

export * from './core'

import './textures'
import './shapes'
import './shape-effects'
import './stylize'
import './interactive'
import './distortion'
import './blurs'
import './adjustments'

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

// Presets are reset for Session 5. Empty for now; downstream consumers
// reading PRESET_GROUPS / FLAT_PRESETS get an empty list rather than a
// missing-export error.
export const PRESET_GROUPS: PresetGroup[] = []
export const FLAT_PRESETS: PresetEntry[] = []
