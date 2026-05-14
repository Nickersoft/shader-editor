import type { SpatialControl } from "@/shaders/core/spatial";

export function rgbFromColor(color: unknown, fallback: string): string {
  if (!Array.isArray(color)) return fallback;
  const r = Math.round(((color[0] as number) ?? 0) * 255);
  const g = Math.round(((color[1] as number) ?? 0) * 255);
  const b = Math.round(((color[2] as number) ?? 0) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

// Stable key for `{#each}` reconciliation: index keys break when
// `resolveSpatialControls` returns a differently-shaped array for a
// different config (kind at the same index changes, stale handle state
// and onDrag closures get reused).
export function controlKey(c: SpatialControl, idx: number): string {
  switch (c.kind) {
    case "point":
    case "colorStop":
      return `${c.kind}:${c.x}:${c.y}`;
    case "radius":
      return `radius:${c.cx}:${c.cy}:${c.r}`;
    case "transform":
      return `transform:${c.x}:${c.y}`;
    case "boundingBox":
      return `bbox:${c.cx}:${c.cy}:${c.w}:${c.h}`;
    case "segment":
      return `segment:${c.from[0]}:${c.to[0]}`;
    case "polygon":
      return `polygon:${c.points.map((p) => p[0]).join(",")}`;
    case "pointVec2":
    case "colorStopVec2":
      return `${c.kind}:${c.key}`;
    case "radiusVec2":
      return `radiusVec2:${c.center}:${c.r}`;
    case "segmentVec2":
      return `segmentVec2:${c.from}:${c.to}`;
    default:
      return `idx:${idx}`;
  }
}
