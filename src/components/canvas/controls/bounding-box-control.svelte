<script lang="ts">
  import type { BoundingBoxControl } from "@/shaders/core/spatial";
  import DraggableHandle from "./draggable-handle.svelte";
  import { COLORS } from "../consts";
  import { getOverlayContext } from "./context";

  interface Props {
    control: BoundingBoxControl;
  }

  let { control }: Props = $props();

  const ctx = getOverlayContext();

  const BBOX_CORNERS = [
    [-1, -1, "nwse-resize"],
    [1, -1, "nesw-resize"],
    [-1, 1, "nesw-resize"],
    [1, 1, "nwse-resize"],
  ] as const;

  let geom = $derived.by(() => {
    const c = control;
    const config = ctx.config;
    const height = ctx.size.h;
    const center = ctx.toPx({
      x: (ctx.read(c.cx) as number) ?? 0.5,
      y: (ctx.read(c.cy) as number) ?? 0.5,
    });
    const halfMul = c.halfExtent ? 1 : 0.5;
    if (c.extents) {
      const ext = c.extents(config);
      return {
        cx: center.x,
        cy: center.y,
        halfW: ext.w * height,
        halfH: ext.h * height,
        halfMul,
      };
    }
    return {
      cx: center.x,
      cy: center.y,
      halfW: ((ctx.read(c.w) as number) ?? 0.5) * halfMul * height,
      halfH: ((ctx.read(c.h) as number) ?? 0.5) * halfMul * height,
      halfMul,
    };
  });

  function applyBoundingBoxDrag(
    px: number,
    py: number,
    uniformModifier: boolean,
  ) {
    const c = control;
    const config = ctx.config;
    const height = ctx.size.h;
    if (height <= 0) return;

    const { cx: cxPx, cy: cyPx, halfMul } = geom;
    const isUniformField = c.w === c.h;

    const newHalfWPx = Math.max(Math.abs(px - cxPx), 0);
    const newHalfHPx = Math.max(Math.abs(py - cyPx), 0);

    // When a shape supplies its true display extents, the underlying field
    // (e.g. circumscribed radius) doesn't map directly to displayed pixels.
    // Scale the field by the ratio between the dragged corner and the
    // currently-displayed extent.
    if (c.extents) {
      const ext = c.extents(config);
      const oldHalfWPx = ext.w * height;
      const oldHalfHPx = ext.h * height;
      let scaleW = oldHalfWPx > 0.5 ? newHalfWPx / oldHalfWPx : 1;
      let scaleH = oldHalfHPx > 0.5 ? newHalfHPx / oldHalfHPx : 1;
      if (isUniformField || uniformModifier) {
        const s = Math.max(scaleW, scaleH);
        scaleW = s;
        scaleH = s;
      }
      const oldW = (ctx.read(c.w) as number) ?? 0;
      if (isUniformField) {
        ctx.setField(c.w, oldW * scaleW);
      } else {
        const oldH = (ctx.read(c.h) as number) ?? 0;
        ctx.setFields({ [c.w]: oldW * scaleW, [c.h]: oldH * scaleH });
      }
      return;
    }

    let halfWPx = newHalfWPx;
    let halfHPx = newHalfHPx;

    if (isUniformField || uniformModifier) {
      const oldW = (ctx.read(c.w) as number) ?? 0;
      const oldH = (ctx.read(c.h) as number) ?? 0;
      const oldHalfWPx = oldW * halfMul * height;
      const oldHalfHPx = oldH * halfMul * height;
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

    const wField = halfWPx / (halfMul * height);
    const hField = halfHPx / (halfMul * height);

    if (isUniformField) {
      ctx.setField(c.w, Math.max(wField, hField));
    } else {
      ctx.setFields({ [c.w]: wField, [c.h]: hField });
    }
  }
</script>

<g>
  <rect
    x={geom.cx - geom.halfW}
    y={geom.cy - geom.halfH}
    width={geom.halfW * 2}
    height={geom.halfH * 2}
    fill="none"
    stroke={COLORS.guideStroke}
    stroke-width={1}
    stroke-dasharray="3 3"
    style:pointer-events="none"
  />
  {#each BBOX_CORNERS as [sx, sy, cursor] (sx + "," + sy)}
    <DraggableHandle
      cx={geom.cx + sx * geom.halfW}
      cy={geom.cy + sy * geom.halfH}
      fill={COLORS.secondary}
      {cursor}
      onDrag={(px, py, e) =>
        applyBoundingBoxDrag(px, py, e.metaKey || e.ctrlKey)}
    />
  {/each}
</g>
