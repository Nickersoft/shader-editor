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

import { isFunction } from "es-toolkit";
import type { NodeClass } from "./node.svelte";

// ---- Individual control variants ----

export type PointControl = {
  kind: "point";
  x: string;
  y: string;
  label?: string;
};

export type RadiusControl = {
  kind: "radius";
  cx: string;
  cy: string;
  r: string;
  label?: string;
};

// Universal Figma-style transform widget: an oriented bounding box with
// 4 edge handles, 4 corner handles, and rotation hover zones. Reads/writes
// the 5 fields exposed by `transformFields()` (x, y, width, height,
// rotation). All references point at scalar config keys.
export type TransformControl = {
  kind: "transform";
  x: string;
  y: string;
  w: string;
  h: string;
  rotation: string;
  label?: string;
};

// Rectangular bounding box with corner handles. `w` and `h` reference scalar
// config keys controlling the shape's horizontal and vertical extents. When
// both keys are equal the shape is forced to scale uniformly. Set
// `halfExtent: true` if the field stores a half-extent (e.g. radius); leave
// unset if it stores the full extent (e.g. width). Holding cmd/ctrl during
// drag forces uniform scaling regardless of the field configuration.
// `extents` lets a shape report its true half-extents in shader y-units when
// `w`/`h` don't map directly to the rendered footprint (e.g. a polygon's
// circumscribed radius is wider than its actual bounding box). When
// provided, the overlay renders the box at those extents and drags scale
// the underlying fields proportionally.
export type BoundingBoxControl = {
  kind: "boundingBox";
  cx: string;
  cy: string;
  w: string;
  h: string;
  halfExtent?: boolean;
  extents?: (config: Record<string, unknown>) => { w: number; h: number };
  label?: string;
};

export type SegmentControl = {
  kind: "segment";
  from: [string, string];
  to: [string, string];
  label?: string;
};

export type PolygonControl = {
  kind: "polygon";
  points: Array<[string, string]>;
  label?: string;
};

export type ColorStopControl = {
  kind: "colorStop";
  x: string;
  y: string;
  color: string;
  label?: string;
};

// ---- vec2-valued config field variants ----
// Many shaders store positions as `[x, y]` tuples (e.g. zVec2 / zCenter).
// These variants reference a single config key whose value is a 2-element
// array, so the overlay reads/writes the whole vector at once.

export type PointVec2Control = {
  kind: "pointVec2";
  key: string;
  color?: string;
  label?: string;
};

export type RadiusVec2Control = {
  kind: "radiusVec2";
  center: string;
  r: string;
  color?: string;
  label?: string;
};

export type SegmentVec2Control = {
  kind: "segmentVec2";
  from: string;
  to: string;
  colorFrom?: string;
  colorTo?: string;
  label?: string;
};

export type ColorStopVec2Control = {
  kind: "colorStopVec2";
  key: string;
  color: string;
  label?: string;
};

// ---- Full discriminated union ----

export type SpatialControl =
  | PointControl
  | RadiusControl
  | TransformControl
  | BoundingBoxControl
  | SegmentControl
  | PolygonControl
  | ColorStopControl
  | PointVec2Control
  | RadiusVec2Control
  | SegmentVec2Control
  | ColorStopVec2Control;

export type SpatialControlsSpec =
  | readonly SpatialControl[]
  | ((config: Record<string, unknown>) => readonly SpatialControl[]);

/**
 * A `NodeClass` narrowed to guarantee `spatialControls` is defined. Returned by
 * the `hasSpatialControls` guard so call sites can pass the spec directly to
 * `resolveSpatialControls` without `!` or fallback plumbing.
 */
export type NodeClassWithSpatialControls = NodeClass & {
  spatialControls: SpatialControlsSpec;
};

// ---- Render-group unions ----
// `SpatialControl` is a fine-grained discriminated union (one kind per storage
// shape). Renderers group multiple kinds onto a single render path — these
// `Any*` aliases name those groupings so render adapters can take a narrowed
// input instead of receiving the full union and returning `T | null`.

export type AnyPointControl =
  | PointControl
  | PointVec2Control
  | ColorStopControl
  | ColorStopVec2Control;

export type AnyRadiusControl = RadiusControl | RadiusVec2Control;

export type AnySegmentControl = SegmentControl | SegmentVec2Control;

export function isPointControl(c: SpatialControl): c is AnyPointControl {
  return (
    c.kind === "point" ||
    c.kind === "pointVec2" ||
    c.kind === "colorStop" ||
    c.kind === "colorStopVec2"
  );
}

export function isRadiusControl(c: SpatialControl): c is AnyRadiusControl {
  return c.kind === "radius" || c.kind === "radiusVec2";
}

export function isSegmentControl(c: SpatialControl): c is AnySegmentControl {
  return c.kind === "segment" || c.kind === "segmentVec2";
}

/** Resolve a (possibly function-valued) spatial-controls declaration. */
export function resolveSpatialControls(
  spec: SpatialControlsSpec | undefined,
  config: Record<string, unknown>,
): readonly SpatialControl[] {
  return !spec ? [] : isFunction(spec) ? spec(config) : spec;
}
