// Spatial control declarations for canvas overlay handles.
//
// Each Node subclass may declare a `static spatialControls` to expose
// draggable control points on the editor canvas. Values reference fields on
// the class's `static config` schema by key — coordinates are stored 0..1 to
// match what shaders consume directly.
//
// `spatialControls` may be either a static array or a function of the
// current config (so a node can vary its handles by config — e.g. a unified
// Gradient that swaps handles based on its `type` field).

export type SpatialControl =
  | { kind: 'point'; x: string; y: string; label?: string }
  | { kind: 'radius'; cx: string; cy: string; r: string; label?: string }
  | {
      kind: 'segment'
      from: [string, string]
      to: [string, string]
      label?: string
    }
  | { kind: 'polygon'; points: Array<[string, string]>; label?: string }
  | { kind: 'colorStop'; x: string; y: string; color: string; label?: string }
  // ---- vec2-valued config field variants ----
  // Many shaders store positions as `[x, y]` tuples (e.g. zVec2 / zCenter).
  // These variants reference a single config key whose value is a 2-element
  // array, so the overlay reads/writes the whole vector at once.
  | { kind: 'pointVec2'; key: string; color?: string; label?: string }
  | {
      kind: 'radiusVec2'
      center: string
      r: string
      color?: string
      label?: string
    }
  | {
      kind: 'segmentVec2'
      from: string
      to: string
      colorFrom?: string
      colorTo?: string
      label?: string
    }
  | { kind: 'colorStopVec2'; key: string; color: string; label?: string }

export type SpatialControlsSpec =
  | readonly SpatialControl[]
  | ((config: Record<string, unknown>) => readonly SpatialControl[])

export interface NodeClassWithSpatial {
  spatialControls?: SpatialControlsSpec
}

/** Resolve a (possibly function-valued) spatial-controls declaration. */
export function resolveSpatialControls(
  spec: SpatialControlsSpec | undefined,
  config: Record<string, unknown>,
): readonly SpatialControl[] {
  if (!spec) return []
  return typeof spec === 'function' ? spec(config) : spec
}
