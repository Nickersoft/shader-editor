import type { Point, Size } from "@/lib/types";

export type { Point, Size };

export interface HandleProps {
  halfSize: Size;
  onPointerDown: (e: PointerEvent) => void;
}

export type Edge = {
  axis: "y" | "x";
  sign: -1 | 1;
  cursor: string;
};

export type Corner = {
  sx: -1 | 1;
  sy: -1 | 1;
  cursor: string;
};

export type DragMode =
  | { kind: "edge"; axis: "x" | "y"; sign: -1 | 1 }
  | { kind: "corner"; sx: -1 | 1; sy: -1 | 1 }
  | { kind: "rotate" };

export type ResizeTransform = {
  halfSize: Size;
  centerShift: Point;
};

export interface DragState {
  mode: DragMode;
  // Snapshot of the bbox at drag start, in local-frame screen pixels.
  start: {
    center: Point;
    halfSize: Size;
    rotationRad: number;
    // Pointer angle (radians, screen-space) at drag start, for rotation mode.
    pointerAngle: number;
  };
  pointerId: number;
  captureEl: SVGElement | null;
}

export type DragStateWithMode<T extends DragMode["kind"]> = DragState & {
  mode: Extract<DragMode, { kind: T }>;
};
