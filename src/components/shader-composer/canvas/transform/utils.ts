import type { Size, DragState, DragStateWithMode, Point, ResizeTransform } from "./types";

export function computeResize(state: DragState, size: Size, transform: ResizeTransform) {
  // Convert local-frame center shift back into screen-frame pixels.
  const cos = Math.cos(state.start.rotationRad);
  const sin = Math.sin(state.start.rotationRad);

  const shiftPxX = transform.centerShift.x * cos - transform.centerShift.y * sin;
  const shiftPxY = transform.centerShift.x * sin + transform.centerShift.y * cos;

  const newCxPx = state.start.center.x + shiftPxX;
  const newCyPx = state.start.center.y + shiftPxY;

  const baseH = size.h;
  const baseW = size.w;

  return {
    x: newCxPx / baseW,
    y: 1 - newCyPx / baseH,
    width: (transform.halfSize.w * 2) / baseH,
    height: (transform.halfSize.h * 2) / baseH,
  };
}

export function computeCorner(
  local: Point,
  state: DragStateWithMode<"corner">,
  lockAspectRatio?: boolean,
): ResizeTransform {
  const { x: lx, y: ly } = local;

  // Corner drag — opposite corner stays put.
  const fixedLx = -state.mode.sx * state.start.halfSize.w;
  const fixedLy = -state.mode.sy * state.start.halfSize.h;

  let halfSize = {
    w: Math.max(1, Math.abs(lx - fixedLx) / 2),
    h: Math.max(1, Math.abs(ly - fixedLy) / 2),
  };

  if (lockAspectRatio) {
    // Maintain aspect ratio of the bbox at drag start.
    const ratio = state.start.halfSize.w / state.start.halfSize.h;
    const widthFromHeight = halfSize.h * ratio;
    const heightFromWidth = halfSize.w / ratio;

    if (widthFromHeight > halfSize.w) {
      halfSize.w = widthFromHeight;
    } else {
      halfSize.h = heightFromWidth;
    }
  }

  // Center shift in the OLD local frame: the new center sits midway between
  // the fixed corner (-sx*startHalfW, -sy*startHalfH) and the new dragged
  // corner (-sx*startHalfW + sx*2*newHalfW, …), which simplifies to the
  // half-extent delta along each axis. Holds correct under aspect-lock too,
  // since newHalfW/newHalfH already reflect the post-lock extents.
  const recenterX = state.mode.sx * (halfSize.w - state.start.halfSize.w);
  const recenterY = state.mode.sy * (halfSize.h - state.start.halfSize.h);

  return {
    halfSize,
    centerShift: {
      x: recenterX,
      y: recenterY,
    },
  };
}

export function computeEdge(local: Point, state: DragStateWithMode<"edge">): ResizeTransform {
  const { x: lx, y: ly } = local;

  // One axis grows toward the dragged edge while the opposite edge
  // stays anchored. The bbox center shifts along the same axis.
  let halfSize: Size = { w: state.start.halfSize.w, h: state.start.halfSize.h };
  let centerShift: Point = { x: 0, y: 0 };

  switch (state.mode.axis) {
    case "x": {
      const fixedLocalX = -state.mode.sign * state.start.halfSize.w;
      const draggedLocalX = lx;
      const newCenterLocalX = (fixedLocalX + draggedLocalX) / 2;

      halfSize.w = Math.max(1, Math.abs(draggedLocalX - fixedLocalX) / 2);
      centerShift.x = newCenterLocalX;

      break;
    }
    case "y": {
      const fixedLocalY = -state.mode.sign * state.start.halfSize.h;
      const draggedLocalY = ly;
      const newCenterLocalY = (fixedLocalY + draggedLocalY) / 2;

      halfSize.h = Math.max(1, Math.abs(draggedLocalY - fixedLocalY) / 2);
      centerShift.y = newCenterLocalY;

      break;
    }
  }

  return { halfSize, centerShift };
}

export function computeRotation(point: Point, state: DragState, snap?: boolean) {
  const { x: px, y: py } = point;

  const angle = Math.atan2(py - state.start.center.y, px - state.start.center.x);
  const delta = angle - state.start.pointerAngle;

  let nextRad = state.start.rotationRad + delta;

  // Coarse snap: hold Shift to snap to 15° increments.
  if (snap) {
    const step = (15 * Math.PI) / 180;
    nextRad = Math.round(nextRad / step) * step;
  }

  const nextDeg = (nextRad * 180) / Math.PI;

  // Normalise to [0, 360).
  return ((nextDeg % 360) + 360) % 360;
}

// Convert a pointer event from screen space into the bbox-local frame
// (centered on the bbox, axis-aligned to the rotated bbox, in pixels).
export function pointerToLocal(client: Point, rect: DOMRect, state: DragState): Point {
  const px = client.x - rect.left;
  const py = client.y - rect.top;

  const dx = px - state.start.center.x;
  const dy = py - state.start.center.y;

  const cos = Math.cos(-state.start.rotationRad);
  const sin = Math.sin(-state.start.rotationRad);

  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}
