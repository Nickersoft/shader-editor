export type DragMode =
  | { kind: "edge"; axis: "x" | "y"; sign: -1 | 1 }
  | { kind: "corner"; sx: -1 | 1; sy: -1 | 1 }
  | { kind: "rotate" };

export type Point = { x: number; y: number };

export interface DragState {
  mode: DragMode;
  // Snapshot of the bbox at drag start, in local-frame screen pixels.
  start: {
    center: Point;
    halfWidth: number;
    halfHeight: number;
    rotationRad: number;
    // Pointer angle (radians, screen-space) at drag start, for rotation mode.
    pointerAngle: number;
  };
  pointerId: number;
  captureEl: SVGElement | null;
}
