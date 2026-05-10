<script lang="ts">
    import type { DragState } from "./types";

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

    const HANDLE_SIZE = 8;
    const ROTATE_HOT_RADIUS = 16;
    const EDGE_THICKNESS = 8;

    // --- Coordinate conversions ------------------------------------------------
    // Width/height are y-relative (matches the shaders' `_ar = vec2(W/H, 1.0)`
    // convention) so a 0.5 value spans 0.5 × canvas-height in pixels along
    // either axis.
    let centerPx = $derived({
        x: x * canvasWidth,
        y: (1 - y) * canvasHeight,
    });

    let halfWPx = $derived((width / 2) * canvasHeight);
    let halfHPx = $derived((height / 2) * canvasHeight);

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
        const svg = (e.currentTarget as SVGElement).ownerSVGElement;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const startPointerX = e.clientX - rect.left;
        const startPointerY = e.clientY - rect.top;
        drag = {
            mode,
            start: {
                center: centerPx,
                halfWidth: halfWPx,
                halfHeight: halfHPx,
                rotationRad: rotationRad,
                pointerAngle: Math.atan2(
                    startPointerY - centerPx.y,
                    startPointerX - centerPx.x,
                ),
            },
            pointerId: e.pointerId,
            captureEl: e.currentTarget as SVGElement,
        };
        drag.captureEl?.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!drag) return;
        applyPointerMove(e);
    }

    function applyPointerMove(e: PointerEvent) {
        const state = drag;
        if (!state) return;
        const svg = state.captureEl?.ownerSVGElement;
        if (!svg) return;

        if (state.mode.kind === "rotate") {
            const rect = svg.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const angle = Math.atan2(py - state.startCy, px - state.startCx);
            const delta = angle - state.startPointerAngle;
            let nextRad = state.startRotationRad + delta;
            // Coarse snap: hold Shift to snap to 15° increments.
            if (e.shiftKey) {
                const step = (15 * Math.PI) / 180;
                nextRad = Math.round(nextRad / step) * step;
            }
            let nextDeg = (nextRad * 180) / Math.PI;
            // Normalise to [0, 360).
            nextDeg = ((nextDeg % 360) + 360) % 360;
            onChange({ x, y, width, height, rotation: nextDeg });
            return;
        }

        const { lx, ly } = pointerToLocal(e.clientX, e.clientY, svg, state);

        if (state.mode.kind === "edge") {
            // One axis grows toward the dragged edge while the opposite edge
            // stays anchored. The bbox center shifts along the same axis.
            let newHalfW = state.startHalfW;
            let newHalfH = state.startHalfH;
            let localCenterShiftX = 0;
            let localCenterShiftY = 0;
            if (state.mode.axis === "x") {
                const fixedLocalX = -state.mode.sign * state.startHalfW;
                const draggedLocalX = lx;
                const newCenterLocalX = (fixedLocalX + draggedLocalX) / 2;
                newHalfW = Math.max(
                    1,
                    Math.abs(draggedLocalX - fixedLocalX) / 2,
                );
                localCenterShiftX = newCenterLocalX;
            } else {
                const fixedLocalY = -state.mode.sign * state.startHalfH;
                const draggedLocalY = ly;
                const newCenterLocalY = (fixedLocalY + draggedLocalY) / 2;
                newHalfH = Math.max(
                    1,
                    Math.abs(draggedLocalY - fixedLocalY) / 2,
                );
                localCenterShiftY = newCenterLocalY;
            }
            applyResize(
                state,
                newHalfW,
                newHalfH,
                localCenterShiftX,
                localCenterShiftY,
            );
            return;
        }

        // Corner drag — opposite corner stays put.
        const fixedLx = -state.mode.sx * state.startHalfW;
        const fixedLy = -state.mode.sy * state.startHalfH;
        let newHalfW = Math.max(1, Math.abs(lx - fixedLx) / 2);
        let newHalfH = Math.max(1, Math.abs(ly - fixedLy) / 2);

        if (e.shiftKey) {
            // Maintain aspect ratio of the bbox at drag start.
            const ratio = state.startHalfW / state.startHalfH;
            const widthFromHeight = newHalfH * ratio;
            const heightFromWidth = newHalfW / ratio;
            if (widthFromHeight > newHalfW) {
                newHalfW = widthFromHeight;
            } else {
                newHalfH = heightFromWidth;
            }
        }

        // Center shift in the OLD local frame: the new center sits midway between
        // the fixed corner (-sx*startHalfW, -sy*startHalfH) and the new dragged
        // corner (-sx*startHalfW + sx*2*newHalfW, …), which simplifies to the
        // half-extent delta along each axis. Holds correct under aspect-lock too,
        // since newHalfW/newHalfH already reflect the post-lock extents.
        const recenterX = state.mode.sx * (newHalfW - state.startHalfW);
        const recenterY = state.mode.sy * (newHalfH - state.startHalfH);
        applyResize(state, newHalfW, newHalfH, recenterX, recenterY);
    }

    function applyResize(
        state: DragState,
        newHalfW: number,
        newHalfH: number,
        localCenterShiftX: number,
        localCenterShiftY: number,
    ) {
        // Convert local-frame center shift back into screen-frame pixels.
        const cos = Math.cos(state.startRotationRad);
        const sin = Math.sin(state.startRotationRad);
        const shiftPxX = localCenterShiftX * cos - localCenterShiftY * sin;
        const shiftPxY = localCenterShiftX * sin + localCenterShiftY * cos;
        const newCxPx = state.startCx + shiftPxX;
        const newCyPx = state.startCy + shiftPxY;

        const baseH = canvasHeight;
        const baseW = canvasWidth;
        if (baseH <= 0 || baseW <= 0) return;
        onChange({
            x: newCxPx / baseW,
            y: 1 - newCyPx / baseH,
            width: (newHalfW * 2) / baseH,
            height: (newHalfH * 2) / baseH,
            rotation,
        });
    }

    function handlePointerUp(e: PointerEvent) {
        const state = drag;
        if (!state) return;
        state.captureEl?.releasePointerCapture(e.pointerId);
        drag = null;
    }

    // --- Cursor strings --------------------------------------------------------
    // Edge/corner resize cursors are the only ones the browser draws sensibly
    // for arbitrary rotations; our shape rotation isn't fed into the cursor,
    // but on light/moderate rotations the directional hint is still useful.
    const EDGES = [
        { axis: "y" as const, sign: -1 as const, cursor: "ns-resize" }, // top
        { axis: "y" as const, sign: 1 as const, cursor: "ns-resize" }, // bottom
        { axis: "x" as const, sign: -1 as const, cursor: "ew-resize" }, // left
        { axis: "x" as const, sign: 1 as const, cursor: "ew-resize" }, // right
    ];

    const CORNERS: Array<{
        sx: -1 | 1;
        sy: -1 | 1;
        cursor: string;
    }> = [
        { sx: -1, sy: -1, cursor: "nwse-resize" },
        { sx: 1, sy: -1, cursor: "nesw-resize" },
        { sx: -1, sy: 1, cursor: "nesw-resize" },
        { sx: 1, sy: 1, cursor: "nwse-resize" },
    ];

    function rotateCursor(): string {
        // Inline SVG cursor — a circular arrow. Browsers fall back to `grab`
        // when the data: URL isn't supported.
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12a9 9 0 1 1-3.7-7.3' /><polyline points='21 3 21 9 15 9'/></svg>`;
        return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 12 12, grab`;
    }
    const ROTATE_CURSOR = rotateCursor();
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
        x={-halfWPx}
        y={-halfHPx}
        width={halfWPx * 2}
        height={halfHPx * 2}
        fill="none"
        stroke="rgba(59, 130, 246, 0.6)"
        stroke-width="1"
        stroke-dasharray="3 3"
        vector-effect="non-scaling-stroke"
        style:pointer-events="none"
    />

    <!-- Rotation hot-zones: invisible squares just outside each corner. -->
    {#each CORNERS as corner (corner.sx + "," + corner.sy + ":rot")}
        {@const cx = corner.sx * (halfWPx + ROTATE_HOT_RADIUS / 2)}
        {@const cy = corner.sy * (halfHPx + ROTATE_HOT_RADIUS / 2)}
        <rect
            role="button"
            tabindex="-1"
            aria-label="Rotate"
            x={cx - ROTATE_HOT_RADIUS / 2}
            y={cy - ROTATE_HOT_RADIUS / 2}
            width={ROTATE_HOT_RADIUS}
            height={ROTATE_HOT_RADIUS}
            fill="transparent"
            style:cursor={ROTATE_CURSOR}
            style:pointer-events="auto"
            onpointerdown={(e) => startDrag(e, { kind: "rotate" })}
        />
    {/each}

    <!-- Edge hit-strips: thin transparent rectangles along each edge. -->
    {#each EDGES as edge (edge.axis + edge.sign)}
        {#if edge.axis === "x"}
            <rect
                role="button"
                tabindex="-1"
                aria-label="Resize"
                x={edge.sign * halfWPx - EDGE_THICKNESS / 2}
                y={-halfHPx}
                width={EDGE_THICKNESS}
                height={halfHPx * 2}
                fill="transparent"
                style:cursor={edge.cursor}
                style:pointer-events="auto"
                onpointerdown={(e) =>
                    startDrag(e, {
                        kind: "edge",
                        axis: edge.axis,
                        sign: edge.sign,
                    })}
            />
        {:else}
            <rect
                role="button"
                tabindex="-1"
                aria-label="Resize"
                x={-halfWPx}
                y={edge.sign * halfHPx - EDGE_THICKNESS / 2}
                width={halfWPx * 2}
                height={EDGE_THICKNESS}
                fill="transparent"
                style:cursor={edge.cursor}
                style:pointer-events="auto"
                onpointerdown={(e) =>
                    startDrag(e, {
                        kind: "edge",
                        axis: edge.axis,
                        sign: edge.sign,
                    })}
            />
        {/if}
    {/each}

    <!-- Corner handles. -->
    {#each CORNERS as corner (corner.sx + "," + corner.sy)}
        <rect
            role="button"
            tabindex="-1"
            aria-label="Resize corner"
            x={corner.sx * halfWPx - HANDLE_SIZE / 2}
            y={corner.sy * halfHPx - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#22d3ee"
            stroke="#0a0a0a"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
            style:cursor={corner.cursor}
            style:pointer-events="auto"
            onpointerdown={(e) =>
                startDrag(e, { kind: "corner", sx: corner.sx, sy: corner.sy })}
        />
    {/each}
</g>
