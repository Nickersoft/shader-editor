import type { AnyPointControl, AnyRadiusControl, AnySegmentControl } from "@/shaders/core/spatial";
import { COLORS } from "../consts";
import { rgbFromColor } from "../utils";
import type { CanvasOverlayContext } from "./context";

// Both `point`/`colorStop` (scalar x/y keys) and `*Vec2` (single tuple key)
// normalise to the same `PointHandle` so render branches don't fork on
// storage form.
export type PointHandle = {
  read: () => [number, number];
  write: (v: [number, number]) => void;
};

export function pointHandleXY(
  ctx: CanvasOverlayContext,
  xKey: string,
  yKey: string,
  dx = 0.5,
  dy = 0.5,
): PointHandle {
  return {
    read: () => [(ctx.config[xKey] as number) ?? dx, (ctx.config[yKey] as number) ?? dy],
    write: ([x, y]) => ctx.setFields({ [xKey]: x, [yKey]: y }),
  };
}

export function pointHandleVec2(
  ctx: CanvasOverlayContext,
  key: string,
  defaults: [number, number] = [0.5, 0.5],
): PointHandle {
  return {
    read: () => (ctx.config[key] as [number, number] | undefined) ?? defaults,
    write: (v) => ctx.setField(key, v),
  };
}

export function tintFrom(
  ctx: CanvasOverlayContext,
  colorKey: string | undefined,
  fallback: string,
): string {
  return colorKey ? rgbFromColor(ctx.config[colorKey], fallback) : fallback;
}

export type PointRender = { handle: PointHandle; fill: string; size: number };

export function asPoint(ctx: CanvasOverlayContext, c: AnyPointControl): PointRender {
  switch (c.kind) {
    case "point":
      return {
        handle: pointHandleXY(ctx, c.x, c.y),
        fill: COLORS.primary,
        size: 8,
      };
    case "pointVec2":
      return {
        handle: pointHandleVec2(ctx, c.key),
        fill: tintFrom(ctx, c.color, COLORS.primary),
        size: 12,
      };
    case "colorStop":
      return {
        handle: pointHandleXY(ctx, c.x, c.y),
        fill: tintFrom(ctx, c.color, COLORS.primary),
        size: 12,
      };
    case "colorStopVec2":
      return {
        handle: pointHandleVec2(ctx, c.key),
        fill: tintFrom(ctx, c.color, COLORS.primary),
        size: 12,
      };
  }
}

export type RadiusRender = {
  center: PointHandle;
  rKey: string;
  rDefault: number;
  centerFill: string | null;
};

export function asRadius(ctx: CanvasOverlayContext, c: AnyRadiusControl): RadiusRender {
  if (c.kind === "radius") {
    return {
      center: pointHandleXY(ctx, c.cx, c.cy),
      rKey: c.r,
      rDefault: 0.3,
      centerFill: null,
    };
  }
  return {
    center: pointHandleVec2(ctx, c.center),
    rKey: c.r,
    rDefault: 0.3,
    centerFill: tintFrom(ctx, c.color, COLORS.primary),
  };
}

export type SegmentRender = {
  from: PointHandle;
  to: PointHandle;
  fromFill: string;
  toFill: string;
  size: number;
};

export function asSegment(ctx: CanvasOverlayContext, c: AnySegmentControl): SegmentRender {
  if (c.kind === "segment") {
    return {
      from: pointHandleXY(ctx, c.from[0], c.from[1], 0, 0),
      to: pointHandleXY(ctx, c.to[0], c.to[1], 1, 1),
      fromFill: COLORS.primary,
      toFill: COLORS.accent,
      size: 8,
    };
  }
  return {
    from: pointHandleVec2(ctx, c.from, [0, 0.5]),
    to: pointHandleVec2(ctx, c.to, [1, 0.5]),
    fromFill: tintFrom(ctx, c.colorFrom, COLORS.primary),
    toFill: tintFrom(ctx, c.colorTo, COLORS.accent),
    size: 12,
  };
}
