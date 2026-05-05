// Top-level barrel for the authoring layer.
//
// Each primitive file under shapes/, textures/, effects/, distortion/, and
// overlays/ registers its class with the global Registry by importing
// `register` and calling it at module load. This file imports each primitive
// (transitively, via the per-category `index.ts` files) so a single
// `import '@/shaders'` is enough to populate the registry.

export * from './core'

import './shapes'
import './textures'
import './effects'
import './distortion'
import './overlays'

export { PRESET_GROUPS, FLAT_PRESETS } from './presets'
export type { PresetEntry, PresetGroup, PresetFidelity } from './presets'
