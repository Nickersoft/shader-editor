import { createContext } from "svelte";
import type { Point, Size } from "@/lib/types";

export interface CanvasOverlayContext {
  readonly config: Record<string, unknown>;
  readonly size: Size;
  toPx(uv: Point): Point;
  fromPx(px: Point): Point;
  radiusToPx(r: number): number;
  radiusFromPx(rPx: number): number;
  /**
   * Read a field value by address. Plain keys read from the layer's
   * `uniforms` bag; `graph:<nodeId>:<key>` addresses route into a graph
   * node's `config`. Use this in place of `config[key]` so controls
   * declared by primitives resolve correctly.
   */
  read(key: string): unknown;
  /** Read a scalar config field by key. Returns `fallback` if the field is
   *  missing or not a finite number. */
  readNumber(key: string, fallback?: number): number;
  setField(key: string, value: number | [number, number]): void;
  setFields(updates: Record<string, unknown>): void;
}

export const [getOverlayContext, setOverlayContext] = createContext<CanvasOverlayContext>();
