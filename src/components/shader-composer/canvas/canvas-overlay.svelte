<script lang="ts">
  import type { Layer } from "@/shaders/core/scene.svelte";
  import {
    resolveSpatialControls,
    type SpatialControlsSpec,
  } from "@/shaders/core/spatial";
  import { composer } from "@/lib/state/composer.svelte";
  import DraggableHandle from "./draggable-handle.svelte";

  import { TransformOverlay } from "./transform";

  interface Props {
    canvas: HTMLCanvasElement | null;
    layer: Layer | null;
  }

  let { canvas, layer }: Props = $props();

  let width = $state(0);
  let height = $state(0);

  $effect(() => {
    if (!canvas) return;
    const update = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  });

  function rgbFromColor(color: unknown, fallback: string): string {
    if (!Array.isArray(color)) return fallback;
    const r = Math.round(((color[0] as number) ?? 0) * 255);
    const g = Math.round(((color[1] as number) ?? 0) * 255);
    const b = Math.round(((color[2] as number) ?? 0) * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function toPx(v: number, axis: number): number {
    return v * axis;
  }
  function fromPx(px: number, axis: number): number {
    return axis > 0 ? px / axis : 0;
  }
  function toPxY(v: number, h: number): number {
    return (1 - v) * h;
  }
  function fromPxY(px: number, h: number): number {
    return h > 0 ? 1 - px / h : 0;
  }
  // Shapes render with `_ar = vec2(u_resolution.x / u_resolution.y, 1.0)`, so
  // the y-axis is the reference: a radius/extent of `r` covers `r * h` pixels
  // in both x and y. Using `min(w, h)` undershoots on portrait canvases where
  // the visible shape extends beyond the bounding box.
  function radiusToPx(v: number, _w: number, h: number): number {
    return v * h;
  }
  function radiusFromPx(px: number, _w: number, h: number): number {
    return h > 0 ? px / h : 0;
  }

  let cls = $derived(
    layer?.source.cls as { spatialControls?: SpatialControlsSpec } | undefined,
  );
  let config = $derived(
    (layer?.source.config as Record<string, unknown>) ?? {},
  );
  let controls = $derived(
    cls && "spatialControls" in cls
      ? resolveSpatialControls(cls.spatialControls, config)
      : [],
  );
  let sourceId = $derived(layer?.source.id ?? "");

  function setField(key: string, value: number | [number, number]) {
    composer.updateConfig(sourceId, key, value);
  }

  function setFields(updates: Record<string, unknown>) {
    composer.updateConfigBatch(sourceId, updates);
  }

  const BBOX_CORNERS = [
    [-1, -1, "nwse-resize"],
    [1, -1, "nesw-resize"],
    [-1, 1, "nesw-resize"],
    [1, 1, "nwse-resize"],
  ] as const;

  function applyBoundingBoxDrag(
    c: {
      cx: string;
      cy: string;
      w: string;
      h: string;
      halfExtent?: boolean;
      extents?: (config: Record<string, unknown>) => { w: number; h: number };
    },
    px: number,
    py: number,
    uniformModifier: boolean,
  ) {
    const cxVal = (config[c.cx] as number) ?? 0.5;
    const cyVal = (config[c.cy] as number) ?? 0.5;
    const cxPx = toPx(cxVal, width);
    const cyPx = toPxY(cyVal, height);
    const base = height;
    if (base <= 0) return;
    const isUniformField = c.w === c.h;

    const newHalfWPx = Math.max(Math.abs(px - cxPx), 0);
    const newHalfHPx = Math.max(Math.abs(py - cyPx), 0);

    // When a shape supplies its true display extents, the underlying field
    // (e.g. circumscribed radius) doesn't map directly to displayed pixels.
    // Scale the field by the ratio between the dragged corner and the
    // currently-displayed extent.
    if (c.extents) {
      const ext = c.extents(config);
      const oldHalfWPx = ext.w * base;
      const oldHalfHPx = ext.h * base;
      let scaleW = oldHalfWPx > 0.5 ? newHalfWPx / oldHalfWPx : 1;
      let scaleH = oldHalfHPx > 0.5 ? newHalfHPx / oldHalfHPx : 1;
      if (isUniformField || uniformModifier) {
        const s = Math.max(scaleW, scaleH);
        scaleW = s;
        scaleH = s;
      }
      const oldW = (config[c.w] as number) ?? 0;
      if (isUniformField) {
        setField(c.w, oldW * scaleW);
      } else {
        const oldH = (config[c.h] as number) ?? 0;
        setFields({ [c.w]: oldW * scaleW, [c.h]: oldH * scaleH });
      }
      return;
    }

    const halfMul = c.halfExtent ? 1 : 0.5;
    let halfWPx = newHalfWPx;
    let halfHPx = newHalfHPx;

    if (isUniformField || uniformModifier) {
      const oldW = (config[c.w] as number) ?? 0;
      const oldH = (config[c.h] as number) ?? 0;
      const oldHalfWPx = oldW * halfMul * base;
      const oldHalfHPx = oldH * halfMul * base;
      if (isUniformField || oldHalfWPx < 0.5 || oldHalfHPx < 0.5) {
        const m = Math.max(halfWPx, halfHPx);
        halfWPx = m;
        halfHPx = m;
      } else {
        const ratio = Math.max(halfWPx / oldHalfWPx, halfHPx / oldHalfHPx);
        halfWPx = oldHalfWPx * ratio;
        halfHPx = oldHalfHPx * ratio;
      }
    }

    const wField = halfWPx / (halfMul * base);
    const hField = halfHPx / (halfMul * base);

    if (isUniformField) {
      setField(c.w, Math.max(wField, hField));
    } else {
      setFields({ [c.w]: wField, [c.h]: hField });
    }
  }
</script>

{#if layer && width > 0 && height > 0 && controls.length > 0}
  <svg
    class="absolute inset-0 pointer-events-none"
    {width}
    {height}
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none"
  >
    {#each controls as c, idx (idx)}
      {#if c.kind === "point"}
        {@const cx = toPx((config[c.x] as number) ?? 0.5, width)}
        {@const cy = toPxY((config[c.y] as number) ?? 0.5, height)}
        <DraggableHandle
          {cx}
          {cy}
          fill="#3b82f6"
          onDrag={(px, py) => {
            setFields({
              [c.x]: fromPx(px, width),
              [c.y]: fromPxY(py, height),
            });
          }}
        />
      {:else if c.kind === "radius"}
        {@const cx = toPx((config[c.cx] as number) ?? 0.5, width)}
        {@const cy = toPxY((config[c.cy] as number) ?? 0.5, height)}
        {@const r = radiusToPx((config[c.r] as number) ?? 0.3, width, height)}
        <g>
          <circle
            {cx}
            {cy}
            {r}
            fill="none"
            stroke="rgba(59, 130, 246, 0.5)"
            stroke-width={1}
            stroke-dasharray="3 3"
            style:pointer-events="none"
          />
          <DraggableHandle
            cx={cx + r}
            {cy}
            fill="#22d3ee"
            cursor="ew-resize"
            onDrag={(px, py) => {
              const dx = px - cx;
              const dy = py - cy;
              setField(c.r, radiusFromPx(Math.hypot(dx, dy), width, height));
            }}
          />
        </g>
      {:else if c.kind === "transform"}
        {@const tx = (config[c.x] as number) ?? 0.5}
        {@const ty = (config[c.y] as number) ?? 0.5}
        {@const tw = (config[c.w] as number) ?? 0.5}
        {@const th = (config[c.h] as number) ?? 0.5}
        {@const trot = (config[c.rotation] as number) ?? 0}
        <TransformOverlay
          x={tx}
          y={ty}
          width={tw}
          height={th}
          rotation={trot}
          canvasWidth={width}
          canvasHeight={height}
          onChange={(next) => {
            setFields({
              [c.x]: next.x,
              [c.y]: next.y,
              [c.w]: next.width,
              [c.h]: next.height,
              [c.rotation]: next.rotation,
            });
          }}
        />
      {:else if c.kind === "boundingBox"}
        {@const cx = toPx((config[c.cx] as number) ?? 0.5, width)}
        {@const cy = toPxY((config[c.cy] as number) ?? 0.5, height)}
        {@const ext = c.extents ? c.extents(config) : null}
        {@const halfMul = c.halfExtent ? 1 : 0.5}
        {@const base = height}
        {@const halfW = ext
          ? ext.w * base
          : ((config[c.w] as number) ?? 0.5) * halfMul * base}
        {@const halfH = ext
          ? ext.h * base
          : ((config[c.h] as number) ?? 0.5) * halfMul * base}
        <g>
          <rect
            x={cx - halfW}
            y={cy - halfH}
            width={halfW * 2}
            height={halfH * 2}
            fill="none"
            stroke="rgba(59, 130, 246, 0.5)"
            stroke-width={1}
            stroke-dasharray="3 3"
            style:pointer-events="none"
          />
          {#each BBOX_CORNERS as [sx, sy, cursor] (sx + "," + sy)}
            <DraggableHandle
              cx={cx + sx * halfW}
              cy={cy + sy * halfH}
              fill="#22d3ee"
              {cursor}
              onDrag={(px, py, e) =>
                applyBoundingBoxDrag(c, px, py, e.metaKey || e.ctrlKey)}
            />
          {/each}
        </g>
      {:else if c.kind === "segment"}
        {@const x1 = toPx((config[c.from[0]] as number) ?? 0, width)}
        {@const y1 = toPxY((config[c.from[1]] as number) ?? 0, height)}
        {@const x2 = toPx((config[c.to[0]] as number) ?? 1, width)}
        {@const y2 = toPxY((config[c.to[1]] as number) ?? 1, height)}
        <g>
          <line
            {x1}
            {y1}
            {x2}
            {y2}
            stroke="rgba(59, 130, 246, 0.6)"
            stroke-width={1.5}
            stroke-dasharray="4 3"
            style:pointer-events="none"
          />
          <DraggableHandle
            cx={x1}
            cy={y1}
            fill="#3b82f6"
            onDrag={(px, py) => {
              setFields({
                [c.from[0]]: fromPx(px, width),
                [c.from[1]]: fromPxY(py, height),
              });
            }}
          />
          <DraggableHandle
            cx={x2}
            cy={y2}
            fill="#a855f7"
            onDrag={(px, py) => {
              setFields({
                [c.to[0]]: fromPx(px, width),
                [c.to[1]]: fromPxY(py, height),
              });
            }}
          />
        </g>
      {:else if c.kind === "polygon"}
        <g>
          {#each c.points as [xKey, yKey], pi (pi)}
            {@const px = toPx((config[xKey] as number) ?? 0.5, width)}
            {@const py = toPxY((config[yKey] as number) ?? 0.5, height)}
            <DraggableHandle
              cx={px}
              cy={py}
              fill="#3b82f6"
              onDrag={(nx, ny) => {
                setFields({
                  [xKey]: fromPx(nx, width),
                  [yKey]: fromPxY(ny, height),
                });
              }}
            />
          {/each}
        </g>
      {:else if c.kind === "pointVec2"}
        {@const v = (config[c.key] as [number, number] | undefined) ?? [
          0.5, 0.5,
        ]}
        {@const cx = toPx(v[0], width)}
        {@const cy = toPxY(v[1], height)}
        {@const fill = c.color
          ? rgbFromColor(config[c.color], "#3b82f6")
          : "#3b82f6"}
        <DraggableHandle
          {cx}
          {cy}
          size={12}
          {fill}
          onDrag={(px, py) =>
            setField(c.key, [fromPx(px, width), fromPxY(py, height)])}
        />
      {:else if c.kind === "radiusVec2"}
        {@const v = (config[c.center] as [number, number] | undefined) ?? [
          0.5, 0.5,
        ]}
        {@const cx = toPx(v[0], width)}
        {@const cy = toPxY(v[1], height)}
        {@const r = radiusToPx((config[c.r] as number) ?? 0.3, width, height)}
        {@const centerFill = c.color
          ? rgbFromColor(config[c.color], "#3b82f6")
          : "#3b82f6"}
        <g>
          <circle
            {cx}
            {cy}
            {r}
            fill="none"
            stroke="rgba(59, 130, 246, 0.5)"
            stroke-width={1}
            stroke-dasharray="3 3"
            style:pointer-events="none"
          />
          <DraggableHandle
            {cx}
            {cy}
            fill={centerFill}
            onDrag={(px, py) =>
              setField(c.center, [fromPx(px, width), fromPxY(py, height)])}
          />
          <DraggableHandle
            cx={cx + r}
            {cy}
            fill="#22d3ee"
            cursor="ew-resize"
            onDrag={(px, py) => {
              const dx = px - cx;
              const dy = py - cy;
              setField(c.r, radiusFromPx(Math.hypot(dx, dy), width, height));
            }}
          />
        </g>
      {:else if c.kind === "segmentVec2"}
        {@const a = (config[c.from] as [number, number] | undefined) ?? [
          0, 0.5,
        ]}
        {@const b = (config[c.to] as [number, number] | undefined) ?? [1, 0.5]}
        {@const x1 = toPx(a[0], width)}
        {@const y1 = toPxY(a[1], height)}
        {@const x2 = toPx(b[0], width)}
        {@const y2 = toPxY(b[1], height)}
        {@const fillFrom = c.colorFrom
          ? rgbFromColor(config[c.colorFrom], "#3b82f6")
          : "#3b82f6"}
        {@const fillTo = c.colorTo
          ? rgbFromColor(config[c.colorTo], "#a855f7")
          : "#a855f7"}
        <g>
          <line
            {x1}
            {y1}
            {x2}
            {y2}
            stroke="rgba(59, 130, 246, 0.6)"
            stroke-width={1.5}
            stroke-dasharray="4 3"
            style:pointer-events="none"
          />
          <DraggableHandle
            cx={x1}
            cy={y1}
            size={12}
            fill={fillFrom}
            onDrag={(px, py) =>
              setField(c.from, [fromPx(px, width), fromPxY(py, height)])}
          />
          <DraggableHandle
            cx={x2}
            cy={y2}
            size={12}
            fill={fillTo}
            onDrag={(px, py) =>
              setField(c.to, [fromPx(px, width), fromPxY(py, height)])}
          />
        </g>
      {:else if c.kind === "colorStop"}
        {@const cx = toPx((config[c.x] as number) ?? 0.5, width)}
        {@const cy = toPxY((config[c.y] as number) ?? 0.5, height)}
        {@const color = config[c.color] as number[] | undefined}
        {@const fill = color
          ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})`
          : "#3b82f6"}
        <DraggableHandle
          {cx}
          {cy}
          size={12}
          {fill}
          onDrag={(px, py) => {
            setFields({
              [c.x]: fromPx(px, width),
              [c.y]: fromPxY(py, height),
            });
          }}
        />
      {:else if c.kind === "colorStopVec2"}
        {@const v = (config[c.key] as [number, number] | undefined) ?? [
          0.5, 0.5,
        ]}
        {@const cx = toPx(v[0], width)}
        {@const cy = toPxY(v[1], height)}
        {@const color = config[c.color] as number[] | undefined}
        {@const fill = color
          ? `rgb(${(color[0] ?? 0) * 255}, ${(color[1] ?? 0) * 255}, ${(color[2] ?? 0) * 255})`
          : "#3b82f6"}
        <DraggableHandle
          {cx}
          {cy}
          size={12}
          {fill}
          onDrag={(px, py) =>
            setField(c.key, [fromPx(px, width), fromPxY(py, height)])}
        />
      {/if}
    {/each}
  </svg>
{/if}
