"use client";

// SVG overlay rendered on top of the WebGL canvas. When a layer is selected
// and its source class declares `spatialControls`, this overlay draws
// draggable handles wired to the matching config keys via `updateConfig`.
//
// Pointer events are inert on the SVG root so the canvas keeps receiving
// mouse moves (for `u_mouse`-driven shaders); only the handles capture
// pointer events.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Layer } from "@/shaders/core/scene";
import { resolveSpatialControls, type SpatialControlsSpec } from "@/shaders/core/spatial";
import { useComposer } from "@/state/composer";

/** Convert a 0..1 RGB triple from config into a CSS rgb() string. */
function rgbFromColor(color: unknown, fallback: string): string {
  if (!Array.isArray(color)) return fallback;
  const r = Math.round(((color[0] as number) ?? 0) * 255);
  const g = Math.round(((color[1] as number) ?? 0) * 255);
  const b = Math.round(((color[2] as number) ?? 0) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

interface CanvasOverlayProps {
  /** Element whose dimensions/offset the overlay tracks. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Currently selected Layer (null when nothing or a Scene effect is selected). */
  layer: Layer | null;
}

interface ViewportRect {
  width: number;
  height: number;
}

function useObservedSize(
  ref: React.RefObject<HTMLElement | HTMLCanvasElement | null>,
): ViewportRect {
  const [size, setSize] = useState<ViewportRect>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Map a config-space X coordinate (0..1) to pixels. */
function toPx(v: number, axis: number): number {
  return v * axis;
}
/** Map pixels back to config-space X. */
function fromPx(px: number, axis: number): number {
  return axis > 0 ? px / axis : 0;
}
/**
 * Y-axis is flipped between WebGL's `v_uv` (y-up: 0 at bottom, 1 at top) and
 * the screen pixel convention (y-down: 0 at top, h at bottom). Storage stays
 * in the shader's y-up convention so shaders consume config values
 * unchanged; the overlay does the flip so dragging a handle to the top of
 * the canvas stores y close to 1 — what the shader interprets as "top".
 */
function toPxY(v: number, height: number): number {
  return (1 - v) * height;
}
function fromPxY(px: number, height: number): number {
  return height > 0 ? 1 - px / height : 0;
}

/** Radius is stored as 0..1 of the shorter axis (matches Circle's `_ar` math). */
function radiusToPx(v: number, w: number, h: number): number {
  return v * Math.min(w, h);
}
function radiusFromPx(px: number, w: number, h: number): number {
  const m = Math.min(w, h);
  return m > 0 ? px / m : 0;
}

interface DraggableHandleProps {
  cx: number;
  cy: number;
  size?: number;
  fill?: string;
  cursor?: string;
  onDrag: (px: number, py: number) => void;
}

function DraggableHandle({
  cx,
  cy,
  size = 8,
  fill = "white",
  cursor = "grab",
  onDrag,
}: DraggableHandleProps) {
  const ref = useRef<SVGCircleElement | null>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation();
    draggingRef.current = true;
    ref.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!draggingRef.current) return;
      const svg = ref.current?.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onDrag(x, y);
    },
    [onDrag],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    ref.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <circle
      ref={ref}
      cx={cx}
      cy={cy}
      r={size / 2}
      fill={fill}
      stroke="#0a0a0a"
      strokeWidth={1.5}
      style={{ cursor, pointerEvents: "auto" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

export function CanvasOverlay({ canvasRef, layer }: CanvasOverlayProps) {
  const { updateConfig } = useComposer();
  const { width, height } = useObservedSize(canvasRef);

  const cls = layer?.source.cls as
    | (typeof layer extends null ? never : { spatialControls?: SpatialControlsSpec })
    | undefined;
  const config = (layer?.source.config as Record<string, unknown>) ?? {};
  // Composer mutates config in place (config ref is stable across updates),
  // so we can't memo on `config`. Recompute every render — cheap.
  const controls =
    cls && "spatialControls" in cls ? resolveSpatialControls(cls.spatialControls, config) : [];

  if (!layer || width === 0 || height === 0 || controls.length === 0) {
    return null;
  }
  const sourceId = layer.source.id;
  const setField = (key: string, value: number) => updateConfig(sourceId, key, value);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {controls.map((c, idx) => {
        if (c.kind === "point") {
          const cx = toPx((config[c.x] as number) ?? 0.5, width);
          const cy = toPxY((config[c.y] as number) ?? 0.5, height);
          return (
            <DraggableHandle
              key={`pt-${idx}`}
              cx={cx}
              cy={cy}
              fill="#3b82f6"
              onDrag={(px, py) => {
                setField(c.x, fromPx(px, width));
                setField(c.y, fromPxY(py, height));
              }}
            />
          );
        }
        if (c.kind === "radius") {
          const cx = toPx((config[c.cx] as number) ?? 0.5, width);
          const cy = toPxY((config[c.cy] as number) ?? 0.5, height);
          const r = radiusToPx((config[c.r] as number) ?? 0.3, width, height);
          // Edge handle on the +x ray. Drag distance from center → radius.
          const ex = cx + r;
          const ey = cy;
          return (
            <g key={`rad-${idx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="rgba(59, 130, 246, 0.5)"
                strokeWidth={1}
                strokeDasharray="3 3"
                style={{ pointerEvents: "none" }}
              />
              <DraggableHandle
                cx={ex}
                cy={ey}
                fill="#22d3ee"
                cursor="ew-resize"
                onDrag={(px, py) => {
                  const dx = px - cx;
                  const dy = py - cy;
                  const dist = Math.hypot(dx, dy);
                  setField(c.r, radiusFromPx(dist, width, height));
                }}
              />
            </g>
          );
        }
        if (c.kind === "segment") {
          const x1 = toPx((config[c.from[0]] as number) ?? 0, width);
          const y1 = toPxY((config[c.from[1]] as number) ?? 0, height);
          const x2 = toPx((config[c.to[0]] as number) ?? 1, width);
          const y2 = toPxY((config[c.to[1]] as number) ?? 1, height);
          return (
            <g key={`seg-${idx}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(59, 130, 246, 0.6)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                style={{ pointerEvents: "none" }}
              />
              <DraggableHandle
                cx={x1}
                cy={y1}
                fill="#3b82f6"
                onDrag={(px, py) => {
                  setField(c.from[0], fromPx(px, width));
                  setField(c.from[1], fromPxY(py, height));
                }}
              />
              <DraggableHandle
                cx={x2}
                cy={y2}
                fill="#a855f7"
                onDrag={(px, py) => {
                  setField(c.to[0], fromPx(px, width));
                  setField(c.to[1], fromPxY(py, height));
                }}
              />
            </g>
          );
        }
        if (c.kind === "polygon") {
          return (
            <g key={`poly-${idx}`}>
              {c.points.map(([xKey, yKey], pi) => {
                const px = toPx((config[xKey] as number) ?? 0.5, width);
                const py = toPxY((config[yKey] as number) ?? 0.5, height);
                return (
                  <DraggableHandle
                    key={`p-${pi}`}
                    cx={px}
                    cy={py}
                    fill="#3b82f6"
                    onDrag={(nx, ny) => {
                      setField(xKey, fromPx(nx, width));
                      setField(yKey, fromPxY(ny, height));
                    }}
                  />
                );
              })}
            </g>
          );
        }
        if (c.kind === "pointVec2") {
          const v = (config[c.key] as [number, number] | undefined) ?? [0.5, 0.5];
          const cx = toPx(v[0], width);
          const cy = toPxY(v[1], height);
          const fill = c.color ? rgbFromColor(config[c.color], "#3b82f6") : "#3b82f6";
          return (
            <DraggableHandle
              key={`pv-${idx}`}
              cx={cx}
              cy={cy}
              size={12}
              fill={fill}
              onDrag={(px, py) => {
                setField(c.key, [fromPx(px, width), fromPxY(py, height)] as unknown as number);
              }}
            />
          );
        }
        if (c.kind === "radiusVec2") {
          const v = (config[c.center] as [number, number] | undefined) ?? [0.5, 0.5];
          const cx = toPx(v[0], width);
          const cy = toPxY(v[1], height);
          const r = radiusToPx((config[c.r] as number) ?? 0.3, width, height);
          const ex = cx + r;
          const ey = cy;
          const centerFill = c.color ? rgbFromColor(config[c.color], "#3b82f6") : "#3b82f6";
          return (
            <g key={`rv-${idx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="rgba(59, 130, 246, 0.5)"
                strokeWidth={1}
                strokeDasharray="3 3"
                style={{ pointerEvents: "none" }}
              />
              <DraggableHandle
                cx={cx}
                cy={cy}
                fill={centerFill}
                onDrag={(px, py) => {
                  setField(c.center, [fromPx(px, width), fromPxY(py, height)] as unknown as number);
                }}
              />
              <DraggableHandle
                cx={ex}
                cy={ey}
                fill="#22d3ee"
                cursor="ew-resize"
                onDrag={(px, py) => {
                  const dx = px - cx;
                  const dy = py - cy;
                  const dist = Math.hypot(dx, dy);
                  setField(c.r, radiusFromPx(dist, width, height));
                }}
              />
            </g>
          );
        }
        if (c.kind === "segmentVec2") {
          const a = (config[c.from] as [number, number] | undefined) ?? [0, 0.5];
          const b = (config[c.to] as [number, number] | undefined) ?? [1, 0.5];
          const x1 = toPx(a[0], width);
          const y1 = toPxY(a[1], height);
          const x2 = toPx(b[0], width);
          const y2 = toPxY(b[1], height);
          const fillFrom = c.colorFrom ? rgbFromColor(config[c.colorFrom], "#3b82f6") : "#3b82f6";
          const fillTo = c.colorTo ? rgbFromColor(config[c.colorTo], "#a855f7") : "#a855f7";
          return (
            <g key={`sv-${idx}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(59, 130, 246, 0.6)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                style={{ pointerEvents: "none" }}
              />
              <DraggableHandle
                cx={x1}
                cy={y1}
                size={12}
                fill={fillFrom}
                onDrag={(px, py) => {
                  setField(c.from, [fromPx(px, width), fromPxY(py, height)] as unknown as number);
                }}
              />
              <DraggableHandle
                cx={x2}
                cy={y2}
                size={12}
                fill={fillTo}
                onDrag={(px, py) => {
                  setField(c.to, [fromPx(px, width), fromPxY(py, height)] as unknown as number);
                }}
              />
            </g>
          );
        }
        if (c.kind === "colorStop") {
          const cx = toPx((config[c.x] as number) ?? 0.5, width);
          const cy = toPxY((config[c.y] as number) ?? 0.5, height);
          const color = config[c.color] as number[] | undefined;
          const fill = color
            ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})`
            : "#3b82f6";
          return (
            <DraggableHandle
              key={`stop-${idx}`}
              cx={cx}
              cy={cy}
              size={12}
              fill={fill}
              onDrag={(px, py) => {
                setField(c.x, fromPx(px, width));
                setField(c.y, fromPxY(py, height));
              }}
            />
          );
        }
        if (c.kind === "colorStopVec2") {
          const v = (config[c.key] as [number, number] | undefined) ?? [0.5, 0.5];
          const cx = toPx(v[0], width);
          const cy = toPxY(v[1], height);
          const color = config[c.color] as number[] | undefined;
          const fill = color
            ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})`
            : "#3b82f6";
          return (
            <DraggableHandle
              key={`stopv-${idx}`}
              cx={cx}
              cy={cy}
              size={12}
              fill={fill}
              onDrag={(px, py) => {
                setField(c.key, [fromPx(px, width), fromPxY(py, height)] as unknown as number);
              }}
            />
          );
        }
        return null;
      })}
    </svg>
  );
}
