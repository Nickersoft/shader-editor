<script lang="ts">
  import {
    isPointControl,
    isRadiusControl,
    isSegmentControl,
    resolveSpatialControls,
  } from "@/shaders/core/spatial";
  import { composer } from "@/lib/state/composer.svelte";
  import { SvelteResizeObserver } from "@/lib/reactivity/resize-observer";
  import type { Point, Size } from "@/lib/types";

  import { hasSpatialControls } from "./guards";
  import {
    BoundingBoxControl,
    PointControl,
    PolygonControl,
    RadiusControl,
    SegmentControl,
    TransformControl,
    setOverlayContext,
    type CanvasOverlayContext,
  } from "./controls";
  import type { Layer } from "@/shaders/core/layer.svelte";
  import { EMPTY_CONFIG } from "./consts";
  import { controlKey } from "./utils";

  interface Props {
    canvas: HTMLCanvasElement | null;
    layer: Layer | null;
  }

  let { canvas, layer }: Props = $props();

  const resizeObserver = $derived(new SvelteResizeObserver(canvas));

  const size = $derived<Size>({
    w: resizeObserver.width,
    h: resizeObserver.height,
  });

  const cls = $derived(layer?.source.cls);

  const config = $derived(layer?.source.config ?? EMPTY_CONFIG);

  const controls = $derived(
    cls && hasSpatialControls(cls)
      ? resolveSpatialControls(cls.spatialControls, config)
      : [],
  );

  const sourceId = $derived(layer?.source.id ?? "");

  const ctx: CanvasOverlayContext = {
    get config() {
      return config;
    },
    get size() {
      return size;
    },
    toPx(uv: Point): Point {
      return { x: uv.x * size.w, y: (1 - uv.y) * size.h };
    },
    fromPx(px: Point): Point {
      return { x: px.x / size.w, y: 1 - px.y / size.h };
    },
    radiusToPx(r: number): number {
      return r * size.h;
    },
    radiusFromPx(rPx: number): number {
      return rPx / size.h;
    },
    readNumber(key, fallback = 0) {
      const value = config[key];
      return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
    },
    setField(key, value) {
      composer.updateConfig(sourceId, key, value);
    },
    setFields(updates) {
      composer.updateConfigBatch(sourceId, updates);
    },
  };

  setOverlayContext(ctx);
</script>

{#if layer && size.w > 0 && size.h > 0 && controls.length > 0}
  <svg
    class="absolute inset-0 pointer-events-none"
    width={size.w}
    height={size.h}
    viewBox={`0 0 ${size.w} ${size.h}`}
    preserveAspectRatio="none"
  >
    {#each controls as c, idx (controlKey(c, idx))}
      {#if isPointControl(c)}
        <PointControl control={c} />
      {:else if isRadiusControl(c)}
        <RadiusControl control={c} />
      {:else if isSegmentControl(c)}
        <SegmentControl control={c} />
      {:else if c.kind === "transform"}
        <TransformControl control={c} />
      {:else if c.kind === "boundingBox"}
        <BoundingBoxControl control={c} />
      {:else if c.kind === "polygon"}
        <PolygonControl control={c} />
      {/if}
    {/each}
  </svg>
{/if}
