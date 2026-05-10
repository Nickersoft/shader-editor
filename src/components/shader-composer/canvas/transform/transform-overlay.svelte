<script lang="ts">
  import { CORNERS, EDGES } from "./consts";
  import CornerHandle from "./corner-handle.svelte";
  import EdgeHandle from "./edge-handle.svelte";
  import { isDragMode } from "./guards";
  import type { DragMode, DragState, ResizeTransform } from "./types";
  import {
    computeRotation,
    computeCorner,
    computeEdge,
    computeResize,
    pointerToLocal,
  } from "./utils";
  import RotationHandle from "./rotation-handle.svelte";

  // Figma-style transform widget for shape primitives.
  //
  // Shows the shape's oriented bounding box plus:
  //   - 4 edge handles (drag to stretch one axis; opposite edge stays put)
  //   - 4 corner handles (drag to scale; Shift = preserve aspect; opposite corner stays put)
  //   - 4 rotation hot-zones just outside each corner (cursor turns into the
  //     rotate glyph; drag rotates the box around its center)
  //
  // Coordinate conventions:
  //   - Stored config: x/y in [0,1] UV (y-up); width/height in y-relative
  //     units (1.0 = canvas height); rotation in degrees, positive = clockwise
  //     in screen space (matches the GLSL `rotate2D(p, +θ)` convention used
  //     by every shape).
  //   - Screen: y-down pixels.

  interface Props {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    canvasWidth: number;
    canvasHeight: number;
    onChange: (next: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }) => void;
  }

  let {
    x,
    y,
    width,
    height,
    rotation,
    canvasWidth,
    canvasHeight,
    onChange,
  }: Props = $props();

  // --- Coordinate conversions ------------------------------------------------

  // Width/height are y-relative (matches the shaders' `_ar = vec2(W/H, 1.0)`
  // convention) so a 0.5 value spans 0.5 × canvas-height in pixels along
  // either axis.

  let centerPx = $derived({
    x: x * canvasWidth,
    y: (1 - y) * canvasHeight,
  });

  let halfSize = $derived({
    w: (width / 2) * canvasHeight,
    h: (height / 2) * canvasHeight,
  });

  // Stored rotation is "rotate the GLSL coord frame ccw by θ", which renders
  // the shape clockwise in screen space — match that here so the widget overlay
  // tracks the visible shape.

  let rotationDeg = $derived(rotation);
  let rotationRad = $derived((rotation * Math.PI) / 180);

  // SVG transform that aligns a child to the bbox-local frame (origin at
  // bbox center, x→right, y→down, rotated to match the rendered shape).

  let groupTransform = $derived(
    `translate(${centerPx.x} ${centerPx.y}) rotate(${rotationDeg})`,
  );

  // --- Drag plumbing ---------------------------------------------------------

  let drag = $state<DragState | null>(null);

  function startDrag(e: PointerEvent, mode: DragMode) {
    e.stopPropagation();

    const target = e.currentTarget as SVGElement;
    const svg = target.ownerSVGElement;

    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const startPointerX = e.clientX - rect.left;
    const startPointerY = e.clientY - rect.top;

    drag = {
      mode,
      start: {
        center: centerPx,
        halfSize,
        rotationRad: rotationRad,
        pointerAngle: Math.atan2(
          startPointerY - centerPx.y,
          startPointerX - centerPx.x,
        ),
      },
      pointerId: e.pointerId,
      captureEl: target,
    };

    drag.captureEl?.setPointerCapture(e.pointerId);
  }

  function applyResize(state: DragState, transform: ResizeTransform) {
    const baseH = canvasHeight;
    const baseW = canvasWidth;

    if (baseH <= 0 || baseW <= 0) return;

    const size = { w: canvasWidth, h: canvasHeight };

    onChange({
      ...computeResize(state, size, transform),
      rotation,
    });
  }

  function handlePointerMove(e: PointerEvent) {
    if (!drag) return;

    const svg = drag?.captureEl?.ownerSVGElement;

    if (!svg) return;

    if (isDragMode(drag, "rotate")) {
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      onChange({
        x,
        y,
        width,
        height,
        rotation: computeRotation({ x: px, y: py }, drag),
      });

      return;
    }

    const localPoint = pointerToLocal(
      { x: e.clientX, y: e.clientY },
      svg.getBoundingClientRect(),
      drag,
    );

    if (isDragMode(drag, "edge")) {
      applyResize(drag, computeEdge(localPoint, drag));
    }

    if (isDragMode(drag, "corner")) {
      applyResize(drag, computeCorner(localPoint, drag));
    }
  }

  function handlePointerUp(e: PointerEvent) {
    const state = drag;
    if (!state) return;
    state.captureEl?.releasePointerCapture(e.pointerId);
    drag = null;
  }
</script>

<svelte:window
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
/>

<g transform={groupTransform}>
  <!-- Bounding-box outline. Rendered with vector-effect so stroke stays 1px
	     regardless of any parent transforms; pointer-events disabled so it
	     doesn't intercept clicks meant for the canvas/handles. -->
  <rect
    x={-halfSize.w}
    y={-halfSize.h}
    width={halfSize.w * 2}
    height={halfSize.h * 2}
    fill="none"
    stroke="rgba(59, 130, 246, 0.6)"
    stroke-width="1"
    stroke-dasharray="3 3"
    vector-effect="non-scaling-stroke"
    style:pointer-events="none"
  />

  <!-- Rotation hot-zones: invisible squares just outside each corner. -->
  {#each CORNERS as corner (corner.sx + "," + corner.sy + ":rot")}
    <RotationHandle
      {corner}
      {halfSize}
      onPointerDown={(e) => startDrag(e, { kind: "rotate" })}
    />
  {/each}

  <!-- Edge hit-strips: thin transparent rectangles along each edge. -->
  {#each EDGES as edge (edge.axis + edge.sign)}
    <EdgeHandle
      {edge}
      {halfSize}
      onPointerDown={(e) =>
        startDrag(e, {
          kind: "edge",
          axis: edge.axis,
          sign: edge.sign,
        })}
    />
  {/each}

  <!-- Corner handles. -->
  {#each CORNERS as corner (corner.sx + "," + corner.sy)}
    <CornerHandle
      {corner}
      {halfSize}
      onPointerDown={(e) =>
        startDrag(e, { kind: "corner", sx: corner.sx, sy: corner.sy })}
    />
  {/each}
</g>
